import { notFound } from 'next/navigation'

import { chatContextQuery } from '@/lib/sanity/queries'
import { client } from '@/lib/sanity/client'

import { ChatClient } from './ChatClient'

type ChatContextResult = {
  _id: string
  _type: string
  name?: string
  slug?: string
  building?: { _id?: string; name?: string; pin?: string; slug?: string }
  context?: string
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

  const data = await client.fetch<ChatContextResult>(chatContextQuery, {
    slug: assetId,
  })

  if (!data) {
    notFound()
  }

  if (!data.building) {
    return <p>Konfiguration unvollständig: Kein Gebäude zugeordnet.</p>
  }

  return (
    <ChatClient
      clientSlug={clientSlug}
      assetId={assetId}
      asset={data}
      expectedPin={data.building.pin}
      title={data.name}
      context={data.context}
    />
  )
}
