import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai'
import { z } from 'zod'
import { createClient, type SanityClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { deepContextQuery } from '@/lib/sanity/queries'

// ── Configuration ────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ── Lazy Client Initialization ───────────────────────────
// Create clients inside handler to ensure env vars are available

function getReadClient(): SanityClient {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2024-01-01',
    useCdn: true,
  })
}

function getWriteClient(): SanityClient | null {
  if (!process.env.SANITY_API_TOKEN) {
    return null
  }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  })
}

// ── Types ────────────────────────────────────────────────

interface ContextDoc {
  _id: string
  name?: string
  building?: {
    _id: string
    name: string
    pin?: string
    tenant?: {
      _id: string
      name?: string
    }
  }
}

// ── POST Handler ─────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // 1. Validate environment variables
    const missingVars: string[] = []
    
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      missingVars.push('GOOGLE_GEMINI_API_KEY')
    }
    if (!process.env.SANITY_API_TOKEN) {
      missingVars.push('SANITY_API_TOKEN')
    }
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      missingVars.push('NEXT_PUBLIC_SANITY_PROJECT_ID')
    }
    if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
      missingVars.push('NEXT_PUBLIC_SANITY_DATASET')
    }
    
    if (missingVars.length > 0) {
      console.error('[chat] Missing environment variables:', missingVars.join(', '))
      return NextResponse.json({ 
        error: `Server configuration error: Missing ${missingVars.join(', ')}` 
      }, { status: 500 })
    }

    // 2. Initialize clients (lazy - ensures env vars are available)
    const readClient = getReadClient()
    const writeClient = getWriteClient()

    if (!writeClient) {
      console.error('[chat] writeClient not initialized')
      return NextResponse.json({ error: 'Server configuration error: writeClient' }, { status: 500 })
    }

    // 2. Parse request body (ChatClient format)
    const body = await req.json()
    const { message, pin, assetId, image, userId, userName } = body as {
      message?: string
      pin?: string
      assetId?: string
      image?: string
      userId?: string
      userName?: string
    }

    // 3. Validate required fields
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    if (!assetId || typeof assetId !== 'string') {
      return NextResponse.json({ error: 'Missing assetId' }, { status: 400 })
    }

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'Missing pin' }, { status: 400 })
    }

    // 4. Fetch context from Sanity
    const contextDoc = await readClient.fetch<ContextDoc | null>(deepContextQuery, {
      slug: assetId,
    })

    if (!contextDoc || !contextDoc.building) {
      return NextResponse.json({ error: 'Asset/Building not found' }, { status: 404 })
    }

    // 5. Verify PIN
    if (contextDoc.building.pin && contextDoc.building.pin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    // 6. Extract context
    const tenantName = contextDoc.building.tenant?.name || 'Hausverwaltung'
    const buildingName = contextDoc.building.name
    const assetName = contextDoc.name || 'Unbekannt'
    const tenantId = contextDoc.building.tenant?._id
    const scopeId = contextDoc._id

    // 7. Build AGGRESSIVE ONE-SHOT system prompt
    const systemPrompt = `Du bist ein Facility-Management-Assistent für ${tenantName}.
Gebäude: ${buildingName}
Standort/Objekt: ${assetName}

═══════════════════════════════════════════════════════════
KRITISCHE REGELN - BEFOLGE SIE STRIKT:
═══════════════════════════════════════════════════════════

1. KEINE RÜCKFRAGEN STELLEN!
   - Du hast KEINE Gesprächshistorie
   - Jede Nachricht ist isoliert
   - Frage NIEMALS nach Details, Priorität oder Kategorie
   
2. SOFORTIGE AKTION bei Problemen:
   - Wenn der Benutzer ein Problem meldet (kaputt, undicht, defekt, funktioniert nicht, Störung, Lärm, Geruch, etc.):
   - RUFE SOFORT das Tool 'createTicket' auf
   - WARTE NICHT auf weitere Informationen
   
3. SCHÄTZE fehlende Parameter intelligent:
   - PRIORITY:
     * "emergency" = Wasser, Gas, Feuer, Sicherheit, kein Strom, Aufzug steckt fest
     * "high" = Heizung im Winter, Toilette, Haupttür
     * "medium" = Geräte defekt, normale Reparaturen (DEFAULT)
     * "low" = Kosmetische Schäden, kleine Unannehmlichkeiten
   - CATEGORY:
     * "incident" = Etwas ist kaputt/defekt (DEFAULT)
     * "maintenance" = Routinewartung, Inspektion
   - TITLE: Erstelle einen kurzen, professionellen Titel auf Deutsch
   - DESCRIPTION: Fasse zusammen was der Benutzer gesagt hat

4. ANTWORTFORMAT nach Ticket-Erstellung:
   - Bestätige kurz die Ticket-Erstellung
   - Nenne die Ticket-Nummer
   - Gib einen kurzen Hinweis zur erwarteten Bearbeitungszeit

5. NUR bei echten Fragen (keine Probleme):
   - Beantworte höflich und kurz
   - Verwende KEIN Tool

BEISPIELE:
- "Waschmaschine läuft aus" → createTicket(title: "Waschmaschine undicht", priority: "high", category: "incident")
- "Licht geht nicht" → createTicket(title: "Beleuchtung defekt", priority: "medium", category: "incident")
- "Wasser überall!" → createTicket(title: "Wasserschaden", priority: "emergency", category: "incident")
- "Wann ist die Hausverwaltung erreichbar?" → Antwort ohne Tool

Antworte auf Deutsch (Schweizer Hochdeutsch).`

    // 8. Initialize Gemini
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    })

    // 9. Tool execution handler
    const handleCreateTicket = async (args: {
      title: string
      description: string
      priority: 'low' | 'medium' | 'high' | 'emergency'
      category: 'incident' | 'maintenance'
    }): Promise<string> => {
      console.log('[createTicket] Creating ticket:', args.title, 'Priority:', args.priority)

      try {
        if (!tenantId) {
          console.error('[createTicket] No tenant ID')
          return '❌ Fehler: Mandant nicht gefunden. Bitte kontaktieren Sie die Hausverwaltung direkt.'
        }

        const doc = await writeClient.create({
          _type: 'ticket',
          title: args.title,
          description: args.description,
          priority: args.priority,
          status: 'pending_approval',
          tenant: { _type: 'reference', _ref: tenantId },
          scope: { _type: 'reference', _ref: scopeId },
          ...(userId
            ? { reportedByUser: { _type: 'reference', _ref: userId } }
            : { reportedByName: userName || 'Gast' }),
        } as any)

        console.log('[createTicket] Created:', doc._id)
        const shortId = doc._id.slice(0, 8).toUpperCase()
        
        const priorityText = {
          emergency: '🚨 Notfall',
          high: '🔴 Hoch',
          medium: '🟠 Mittel',
          low: '🔵 Niedrig'
        }[args.priority]

        return `✅ **Ticket #${shortId} wurde erstellt!**

📋 **Details:**
• Betreff: ${args.title}
• Priorität: ${priorityText}
• Status: 🟡 Warte auf Freigabe

Die Hausverwaltung wurde benachrichtigt und wird sich zeitnah um Ihr Anliegen kümmern.${args.priority === 'emergency' ? '\n\n⚠️ Bei akuter Gefahr rufen Sie bitte die Notfallnummer an!' : ''}`
      } catch (error) {
        console.error('[createTicket] Error:', error)
        return '❌ Fehler beim Erstellen des Tickets. Bitte versuchen Sie es erneut oder kontaktieren Sie die Hausverwaltung direkt.'
      }
    }

    // 10. Define tool schema (Gemini-compatible: NO .default(), NO .optional())
    const ticketSchema = z.object({
      title: z.string().describe('Kurzer, professioneller Titel des Problems auf Deutsch'),
      description: z.string().describe('Zusammenfassung des Problems basierend auf der Benutzernachricht'),
      priority: z.enum(['low', 'medium', 'high', 'emergency']).describe('Geschätzte Priorität basierend auf der Dringlichkeit'),
      category: z.enum(['incident', 'maintenance']).describe('incident für Defekte, maintenance für Wartung'),
    })

    // 11. Build message content
    type ContentPart = { type: 'text'; text: string } | { type: 'image'; image: Uint8Array; mimeType: string }
    const contentParts: ContentPart[] = [{ type: 'text', text: message }]

    if (image && typeof image === 'string') {
      try {
        let base64Data = image
        let mimeType = 'image/jpeg'
        if (image.startsWith('data:')) {
          const match = image.match(/^data:([^;]+);base64,(.+)$/)
          if (match) {
            mimeType = match[1] || 'image/jpeg'
            base64Data = match[2]
          }
        }
        contentParts.push({
          type: 'image',
          image: new Uint8Array(Buffer.from(base64Data, 'base64')),
          mimeType,
        })
      } catch (e) {
        console.error('[chat] Image parsing error:', e)
      }
    }

    // 12. Stream response with tool
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages: [{ role: 'user', content: contentParts }],
      tools: {
        createTicket: {
          description: 'Erstellt ein Support-Ticket für eine gemeldete Störung oder Wartungsanfrage. SOFORT verwenden wenn ein Problem gemeldet wird.',
          inputSchema: ticketSchema,
          execute: handleCreateTicket,
        },
      },
    })

    // 13. Collect full text response (including tool results)
    let fullText = ''
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        fullText += part.text
      } else if (part.type === 'tool-result') {
        // Tool result is the return value from execute function
        const toolResult = 'output' in part ? part.output : null
        if (typeof toolResult === 'string') {
          // Tool result IS the response - prioritize it
          fullText = toolResult + (fullText ? '\n\n' + fullText : '')
        }
      }
    }

    // 14. Fallback if empty
    if (!fullText.trim()) {
      fullText = 'Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es erneut.'
    }

    return NextResponse.json({ text: fullText.trim() })
  } catch (error) {
    console.error('[chat] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
