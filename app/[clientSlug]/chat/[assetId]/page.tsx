import { notFound } from 'next/navigation'

import { assetPageQuery } from '@/lib/sanity/queries'
import { client } from '@/lib/sanity/client'

import { ChatClient } from './ChatClient'

type AssetHeaderResult = {
  _id: string
  name?: string
  buildingName?: string
  clientSlug?: string
  mainImage?: { asset?: { url?: string } }
} | null

export default async function ChatPage({
  params,
}: {
  params: Promise<{ clientSlug: string; assetId: string }>
}) {
  const { clientSlug, assetId } = await params

  if (!clientSlug || !assetId) {
    notFound()
  }

  const asset = await client.fetch<AssetHeaderResult>(assetPageQuery, {
    assetId,
  })

  if (!asset || asset.clientSlug !== clientSlug) {
    notFound()
  }

  return (
    <ChatClient
      clientSlug={clientSlug}
      assetId={assetId}
      asset={asset}
    />
  )
}
