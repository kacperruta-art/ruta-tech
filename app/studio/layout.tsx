import type { Metadata } from 'next'
import { metadata as studioMetadata, viewport as studioViewport } from 'next-sanity/studio'

export const metadata: Metadata = {
  ...studioMetadata,
}

export const viewport = studioViewport

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
