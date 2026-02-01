import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

import { client } from '@/sanity/client'

const GEMINI_MODEL = 'gemini-2.0-flash'
const ASSET_QUERY = `*[_type == "asset" && publicId.current == $publicId][0]{
  _id,
  name,
  publicId,
  serviceHistory,
  "location": location->{
    name,
    "parentFloor": parentFloor->{
      name,
      "parentSection": parentSection->{
        name,
        "parentProperty": parentProperty->{
          _id,
          name,
          pin
        }
      }
    }
  },
  "assetType": type->{
    _id,
    name,
    maintenanceInstructions,
    "manuals": manuals[]{
      asset->{
        url,
        originalFilename
      }
    }
  },
  "localManuals": localManuals[]{
    asset->{
      url,
      originalFilename
    }
  }
}`

// Portable Text block structure
type PortableTextBlock = {
  _type?: string
  children?: { text?: string }[]
}

// Convert Portable Text (blocks array) to plain string
function portableTextToPlainText(blocks: PortableTextBlock[] | null | undefined): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return ''
  return blocks
    .map((block) => {
      if (block._type !== 'block' || !block.children) return ''
      return block.children.map((c) => c?.text ?? '').join('')
    })
    .filter(Boolean)
    .join('\n\n')
}

// Service history entry structure
type ServiceHistoryEntry = {
  date?: string
  type?: string
  technician?: string
  description?: string
}

// Format service history as summary string
function formatServiceHistory(entries: ServiceHistoryEntry[] | null | undefined): string {
  if (!Array.isArray(entries) || entries.length === 0) return 'No service history recorded.'
  return entries
    .map((e) => {
      const date = e.date || 'Unknown date'
      const type = e.type || 'Service'
      const desc = e.description?.trim() || 'No details'
      return `[${date}] - [${type}]: ${desc}`
    })
    .join('\n')
}

// Build location context string from asset hierarchy
function buildLocationContext(location: {
  name?: string
  parentFloor?: {
    name?: string
    parentSection?: {
      name?: string
      parentProperty?: { name?: string }
    }
  }
} | null | undefined): string {
  if (!location) return 'Location unknown.'
  const propertyName = location.parentFloor?.parentSection?.parentProperty?.name
  const sectionName = location.parentFloor?.parentSection?.name
  const floorName = location.parentFloor?.name
  const unitName = location.name
  const parts = [propertyName, sectionName, floorName, unitName].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Location unknown.'
}

// Build system prompt with Official Manual, Device Context, and Location
function buildSystemPrompt(
  instructionsText: string,
  historyLog: string,
  manualUrls: string[],
  locationContext: string
): string {
  const manualSection =
    manualUrls.length > 0
      ? `\n\nReference Documents (PDF/TXT/HTML URLs):\n${manualUrls.map((u) => `- ${u}`).join('\n')}`
      : ''

  const baseInstructions = instructionsText.trim() || 'Provide clear, practical guidance for maintenance and troubleshooting.'

  return `You are a helpful technician assistant for Asset Lifecycle Management. You have access to:
1. Official Manual – General knowledge and procedures for this asset type
2. Device Location – Where this specific device is installed
3. Device Context – This specific device's service history
4. Reference Documents – Links to official manuals (when available)

You also have access to the device's specific service history. Use it to diagnose recurring issues (e.g., if a part was just replaced, don't suggest replacing it again immediately).

--- DEVICE LOCATION ---
${locationContext}

--- OFFICIAL MANUAL ---
${baseInstructions}
${manualSection}

--- DEVICE CONTEXT (Service History) ---
Past Events:
${historyLog}

---

Respond concisely and professionally. Focus on actionable steps. Use the service history to inform your recommendations and avoid redundant suggestions.`
}

// Parse image input: accept base64 string or data URL, return inline data format
function parseImageForGemini(
  image: unknown
): { inlineData: { data: string; mimeType: string } } | null {
  if (!image || typeof image !== 'string') return null

  let base64Data: string
  let mimeType = 'image/jpeg'

  if (image.startsWith('data:')) {
    const match = image.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return null
    mimeType = match[1] || 'image/jpeg'
    base64Data = match[2]
  } else {
    base64Data = image
  }

  if (!base64Data) return null
  return { inlineData: { data: base64Data, mimeType } }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { message, pin, publicId, image } = body as {
      message?: string
      pin?: string
      publicId?: string
      image?: string
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      )
    }

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid publicId' },
        { status: 400 }
      )
    }

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid pin' },
        { status: 400 }
      )
    }

    const asset = await client.fetch<{
      _id: string
      name?: string
      publicId?: { current?: string }
      serviceHistory?: Array<{
        date?: string
        type?: string
        technician?: string
        description?: string
      }>
      location?: {
        name?: string
        parentFloor?: {
          name?: string
          parentSection?: {
            name?: string
            parentProperty?: { _id: string; name?: string; pin?: string }
          }
        }
      } | null
      assetType?: {
        _id: string
        name?: string
        maintenanceInstructions?: PortableTextBlock[]
        manuals?: Array<{ asset?: { url?: string; originalFilename?: string } }>
      } | null
      localManuals?: Array<{ asset?: { url?: string; originalFilename?: string } }>
    } | null>(ASSET_QUERY, { publicId })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const propertyPin =
      asset.location?.parentFloor?.parentSection?.parentProperty?.pin
    if (propertyPin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    const instructionsText = portableTextToPlainText(
      asset.assetType?.maintenanceInstructions as PortableTextBlock[] | undefined
    )
    const historyLog = formatServiceHistory(asset.serviceHistory)
    const locationContext = buildLocationContext(asset.location)

    const typeManualUrls =
      asset.assetType?.manuals
        ?.map((m) => m?.asset?.url)
        .filter((u): u is string => typeof u === 'string' && u.length > 0) ?? []
    const localManualUrls =
      asset.localManuals
        ?.map((m) => m?.asset?.url)
        .filter((u): u is string => typeof u === 'string' && u.length > 0) ?? []
    const manualUrls =
      localManualUrls.length > 0 ? localManualUrls : typeManualUrls

    const systemPrompt = buildSystemPrompt(
      instructionsText,
      historyLog,
      manualUrls,
      locationContext
    )
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
    })

    const parts: (string | { inlineData: { data: string; mimeType: string } })[] = [message]
    const imagePart = parseImageForGemini(image)
    if (imagePart) {
      parts.push(imagePart)
    }

    const result = await model.generateContent(parts)
    const response = result.response
    const text = response.text()

    if (!text) {
      return NextResponse.json(
        { error: 'No text generated from model' },
        { status: 500 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('[chat] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
