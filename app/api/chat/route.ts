import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { NextResponse } from 'next/server'

import { getAssetContext } from '@/lib/sanity/queries'

const GEMINI_MODEL = 'gemini-2.0-flash'

type ImagePart = { type: 'image'; image: Uint8Array; mimeType: string }
type TextPart = { type: 'text'; text: string }

function parseImagePart(image: unknown): ImagePart | null {
  if (!image || typeof image !== 'string') return null

  let base64Data = image
  let mimeType = 'image/jpeg'

  if (image.startsWith('data:')) {
    const match = image.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return null
    mimeType = match[1] || 'image/jpeg'
    base64Data = match[2]
  }

  if (!base64Data) return null
  const buffer = Buffer.from(base64Data, 'base64')
  return { type: 'image', image: new Uint8Array(buffer), mimeType }
}

function buildSystemPrompt(context: unknown): string {
  const locationName =
    typeof (context as { locationName?: string })?.locationName === 'string'
      ? (context as { locationName?: string }).locationName
      : 'Unbekannt'
  const prettyContext = JSON.stringify(context, null, 2)

  return `You are a Facility Manager Assistant.
You have access to the building structure in context.building.structure (floors and zones).
If a user reports an issue, try to locate the specific area in the structure.
The asset is located at: ${locationName}.

Context JSON:
${prettyContext}`
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
    const { message, pin, assetId, image } = body as {
      message?: string
      pin?: string
      assetId?: string
      image?: string
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      )
    }

    if (!assetId || typeof assetId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid assetId' },
        { status: 400 }
      )
    }

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid pin' },
        { status: 400 }
      )
    }

    const context = await getAssetContext(assetId)
    if (!context) {
      return new Response('Asset not found', { status: 404 })
    }

    if (context.building?.pin && context.building.pin !== pin) {
      return new Response('Invalid PIN', { status: 401 })
    }

    const systemPrompt = buildSystemPrompt(context)
    const contentParts: Array<TextPart | ImagePart> = [
      { type: 'text', text: message.trim() },
    ]
    const imagePart = parseImagePart(image)
    if (imagePart) {
      contentParts.push(imagePart)
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    })

    const result = await streamText({
      model: google(GEMINI_MODEL),
      system: systemPrompt,
      messages: [{ role: 'user', content: contentParts }],
    })
    const text = await result.text

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
