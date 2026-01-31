import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

import { client } from '@/sanity/client'

const GEMINI_MODEL = 'gemini-2.0-flash'
const ASSET_QUERY = `*[_type == "asset" && publicId.current == $publicId][0]{
  _id,
  title,
  publicId,
  "building": building->{
    _id,
    title,
    pin
  },
  "assetType": assetType->{
    _id,
    title,
    instructions
  }
}`

// Build system prompt from asset type instructions; fallback for missing instructions
function buildSystemPrompt(instructions: string | null | undefined): string {
  const baseInstructions =
    instructions?.trim() ||
    'You are a helpful technician assistant. Provide clear, practical guidance for maintenance and troubleshooting.'
  return `You are a helpful technician assistant. Use the following maintenance instructions as your primary guide when assisting users:

${baseInstructions}

Respond concisely and professionally. Focus on actionable steps.`
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
      title?: string
      publicId?: { current?: string }
      building?: { _id: string; title?: string; pin?: string } | null
      assetType?: { _id: string; title?: string; instructions?: string } | null
    } | null>(ASSET_QUERY, { publicId })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const buildingPin = asset.building?.pin
    if (buildingPin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    const systemPrompt = buildSystemPrompt(asset.assetType?.instructions)
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
