import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    hasGeminiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
    hasSanityToken: !!process.env.SANITY_API_TOKEN,
    hasSanityProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    hasSanityDataset: !!process.env.NEXT_PUBLIC_SANITY_DATASET,
    // Show first 10 chars of token to verify it's set (safe to expose)
    sanityTokenPreview: process.env.SANITY_API_TOKEN 
      ? process.env.SANITY_API_TOKEN.substring(0, 10) + '...' 
      : 'NOT SET',
  })
}
