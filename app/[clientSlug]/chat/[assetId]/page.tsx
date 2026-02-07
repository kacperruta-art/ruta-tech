import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { deepContextQuery } from '@/lib/sanity/queries'
import { client } from '@/lib/sanity/client'

import { ChatClient, type ChatData } from './ChatClient'

// ── Types ─────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ clientSlug: string; assetId: string }>
}

// ── Dynamic Metadata ──────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { clientSlug, assetId } = await params

  return {
    title: `Support: ${assetId} | RUTA-TECH`,
    description: 'Melden Sie ein Problem oder starten Sie einen Chat.',
    robots: 'noindex', // Don't index chat pages
    openGraph: {
      title: `Support Chat – ${clientSlug}`,
      description:
        'Facility-Management Assistent: Probleme melden, Tickets erstellen.',
    },
  }
}

// ── Server Component ──────────────────────────────────────

export default async function ChatPage({ params }: PageProps) {
  const { clientSlug, assetId } = await params

  // 1. Validate URL params
  if (!clientSlug || !assetId) {
    notFound()
  }

  // 2. Fetch full context from Sanity
  const data = await client.fetch<ChatData | null>(deepContextQuery, {
    slug: assetId,
  })

  // 3. Asset/Entity not found
  if (!data) {
    notFound()
  }

  // 4. Security: Tenant slug mismatch detection
  //    Compare the tenant slug from the URL with the one resolved from Sanity.
  //    Prevents cross-tenant access via URL tampering.
  const actualTenantSlug = data.building?.tenantSlug ?? data.building?.tenant?.slug

  if (actualTenantSlug && actualTenantSlug !== clientSlug) {
    console.error(
      `[ChatPage] Security Mismatch: URL tenant "${clientSlug}" does not match asset tenant "${actualTenantSlug}" (asset: ${assetId})`
    )
    notFound()
  }

  // 5. Building not resolved (incomplete configuration)
  if (!data.building) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>
          Konfiguration unvollstaendig
        </h2>
        <p style={{ fontSize: 14, color: '#666' }}>
          Kein Gebaeude zugeordnet. Bitte pruefen Sie, ob das Asset einem
          Standort mit Gebaeude zugewiesen ist.
        </p>
        <p style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
          Asset-ID: {assetId} &middot; Mandant: {clientSlug}
        </p>
      </div>
    )
  }

  // 6. Render authenticated Chat UI
  return <ChatClient data={data} />
}
