import { notFound } from 'next/navigation'

import { deepContextQuery } from '@/lib/sanity/queries'
import { client } from '@/lib/sanity/client'

import { ChatClient, type ChatData } from './ChatClient'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ clientSlug: string; assetId: string }>
}) {
  const { clientSlug, assetId } = await params

  if (!clientSlug || !assetId) {
    notFound()
  }

  const data = await client.fetch<ChatData | null>(deepContextQuery, {
    slug: assetId,
  })

  if (!data) {
    notFound()
  }

  if (!data.building) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Konfiguration unvollständig: Kein Gebäude zugeordnet.</p>
        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
          Bitte prüfen Sie, ob das Asset einem Standort mit Gebäude zugewiesen ist.
        </p>
      </div>
    )
  }

  return <ChatClient data={data} />
}
