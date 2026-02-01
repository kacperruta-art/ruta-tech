import { client } from '@/sanity/client'

import { ChatClient } from './ChatClient'

const ASSET_HEADER_QUERY = `*[
  _type == "asset" &&
  publicId.current == $publicId &&
  location->parentFloor->parentSection->parentProperty->owner->slug.current == $clientSlug
][0]{
  name,
  "location": location->{
    name,
    "parentFloor": parentFloor->{
      name,
      "parentSection": parentSection->{
        name,
        "parentProperty": parentProperty->{
          name
        }
      }
    }
  }
}`

type AssetHeaderResult = {
  name?: string
  location?: {
    name?: string
    parentFloor?: {
      name?: string
      parentSection?: {
        name?: string
        parentProperty?: { name?: string }
      }
    }
  }
} | null

export default async function ChatPage({
  params,
}: {
  params: Promise<{ clientSlug: string; assetId: string }>
}) {
  const { clientSlug, assetId } = await params

  if (!clientSlug || !assetId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 text-gray-600">
        Invalid URL
      </div>
    )
  }

  const asset = await client.fetch<AssetHeaderResult>(ASSET_HEADER_QUERY, {
    publicId: assetId,
    clientSlug,
  })

  if (!asset) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 text-gray-600">
        Asset not found or access denied
      </div>
    )
  }

  return (
    <ChatClient
      clientSlug={clientSlug}
      assetId={assetId}
      asset={asset}
    />
  )
}
