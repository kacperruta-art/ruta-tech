'use client'

import { Card, Flex, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserViewComponent } from 'sanity/structure'

import { apiVersion } from '@/sanity/env'

const BASE_URL = 'https://immo.ruta-tech.ch'

type SupportedType = 'building' | 'floor' | 'unit'

interface MasterData {
  name?: string | null
  slug?: string | null
  publishedSlug?: string | null
  clientSlug?: string | null
}

const getQueryForType = (type: SupportedType) => {
  if (type === 'building') {
    return `*[_id in [$id, $baseId]][0]{
      name,
      "slug": slug.current,
      "clientSlug": client->slug.current,
      "publishedSlug": *[_id == $baseId][0].slug.current
    }`
  }
  return `*[_id in [$id, $baseId]][0]{
    name,
    "slug": slug.current,
    "clientSlug": building->client->slug.current,
    "publishedSlug": *[_id == $baseId][0].slug.current
  }`
}

function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          body * { visibility: hidden; }
          .master-qr-print-area, .master-qr-print-area * { visibility: visible; }
          .master-qr-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
          }
          .no-print, button { display: none !important; }
        }
      `}
    </style>
  )
}

export const MasterQRView: UserViewComponent = (props) => {
  const { documentId, schemaType, options } = props
  const client = useClient({ apiVersion })

  const resolvedType =
    (options as { documentType?: string } | undefined)?.documentType ??
    (typeof schemaType === 'string' ? schemaType : schemaType?.name)

  const documentType = (['building', 'floor', 'unit'] as const).includes(
    resolvedType as SupportedType
  )
    ? (resolvedType as SupportedType)
    : 'building'

  const [data, setData] = useState<MasterData | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const id = String(documentId)
      const baseId = id.replace(/^drafts\./, '')
      const query = getQueryForType(documentType)
      const result = await client.fetch<MasterData | null>(query, { id, baseId })
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [client, documentId, documentType])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resolvedSlug = data?.slug || data?.publishedSlug || ''

  const url = useMemo(() => {
    if (!resolvedSlug || !data?.clientSlug) return ''
    return `${BASE_URL}/${data.clientSlug}/chat/${resolvedSlug}`
  }, [data?.clientSlug, resolvedSlug])

  if (loading) {
    return (
      <Card padding={4} radius={2} tone="default">
        <Text muted>Lade QR Code…</Text>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card padding={4} radius={2} tone="caution">
        <Text>QR Code kann nicht angezeigt werden.</Text>
      </Card>
    )
  }

  if (!resolvedSlug) {
    return (
      <Card padding={4} radius={2} tone="caution" className="no-print">
        <Text>
          ⚠️ Kein Link generiert. Bitte im Tab &apos;Editor&apos; auf
          &apos;Generate&apos; beim Slug klicken und veröffentlichen.
        </Text>
      </Card>
    )
  }

  if (!data.clientSlug) {
    return (
      <Card padding={4} radius={2} tone="caution" className="no-print">
        <Text>Mandant mit Slug fehlt.</Text>
      </Card>
    )
  }

  return (
    <>
      <PrintStyles />
      <Card padding={4} radius={2} tone="default">
        <Flex direction="column" gap={4}>
          <div className="master-qr-print-area">
            <Flex align="center" direction="column" gap={3}>
              <Text size={3} weight="semibold">
                HAUPT-CODE
              </Text>
              <div style={{ padding: 16, background: 'white' }}>
                <QRCodeSVG value={url} size={260} level="H" />
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  marginTop: 10,
                  fontSize: 12,
                  color: 'blue',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  wordBreak: 'break-all',
                  textAlign: 'center',
                }}
              >
                {url}
              </a>
              <Text size={2} weight="medium">
                {data.name || 'Unbenannt'}
              </Text>
            </Flex>
          </div>
        </Flex>
      </Card>
    </>
  )
}
