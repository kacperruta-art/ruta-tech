'use client'

import { Button, Card, Flex, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserViewComponent } from 'sanity/structure'

import { apiVersion } from '@/sanity/env'

const BASE_URL = 'https://immo.ruta-tech.ch'

const ASSET_QUERY = `*[_id == $documentId][0]{
  _id,
  name,
  "slug": slug.current,
  "buildingName": building->name,
  "floorName": parentFloor->name,
  "unitName": parentUnit->name,
  "clientSlug": building->client->slug.current
}`

type AssetResult = {
  _id?: string
  name?: string
  slug?: string
  buildingName?: string
  floorName?: string
  unitName?: string
  clientSlug?: string
} | null

const buildLabel = (asset: AssetResult) => {
  if (!asset) return ''
  const parts = [
    asset.buildingName,
    asset.floorName,
    asset.unitName,
    asset.name,
  ].filter(Boolean)
  return parts.join(' | ')
}

function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          * { visibility: hidden; }
          .qr-print-area, .qr-print-area * { visibility: visible; }
          .qr-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            background: white !important;
            padding: 24px !important;
            z-index: 2147483647 !important;
          }
          .no-print { display: none !important; }
        }
      `}
    </style>
  )
}

export const AssetQRView: UserViewComponent = (props) => {
  const { documentId } = props
  const client = useClient({ apiVersion })

  const [asset, setAsset] = useState<AssetResult>(null)
  const [loading, setLoading] = useState(false)

  const loadAsset = useCallback(async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const result = await client.fetch<AssetResult>(ASSET_QUERY, {
        documentId: String(documentId),
      })
      setAsset(result)
    } catch {
      setAsset(null)
    } finally {
      setLoading(false)
    }
  }, [client, documentId])

  useEffect(() => {
    loadAsset()
  }, [loadAsset])

  const chatUrl = useMemo(() => {
    if (!asset?.slug || !asset?.clientSlug) return ''
    return `${BASE_URL}/${asset.clientSlug}/chat/${asset.slug}`
  }, [asset?.clientSlug, asset?.slug])

  const label = useMemo(() => buildLabel(asset), [asset])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  if (loading) {
    return (
      <Card padding={4} radius={2} tone="default">
        <Text muted>Lade QR Code…</Text>
      </Card>
    )
  }

  if (!asset || !chatUrl) {
    return (
      <Card padding={4} radius={2} tone="caution">
        <Text>
          QR Code kann nicht angezeigt werden. Prüfe, ob das Asset einen Slug
          hat und dem Gebäude ein Mandant mit Slug zugewiesen ist.
        </Text>
      </Card>
    )
  }

  return (
    <>
      <PrintStyles />
      <Card padding={4} radius={2} tone="default">
        <Flex direction="column" gap={4}>
          <Text size={3} weight="semibold" className="no-print">
            QR Code
          </Text>
          <div className="qr-print-area">
            <Flex align="center" direction="column" gap={3}>
              <div style={{ padding: 16, background: 'white' }}>
                <QRCodeSVG value={chatUrl} size={280} level="H" />
              </div>
              <Text size={1} weight="medium">
                {label}
              </Text>
            </Flex>
          </div>
          <Button
            className="no-print"
            mode="default"
            tone="primary"
            text="Drucken"
            onClick={handlePrint}
          />
        </Flex>
      </Card>
    </>
  )
}
