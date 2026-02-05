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
  "clientSlug": coalesce(
    building->client->slug.current,
    parentBuilding->client->slug.current,
    parentFloor->building->client->slug.current,
    parentUnit->building->client->slug.current
  )
}`

interface AssetData {
  _id?: string
  name?: string | null
  slug?: string | null
  buildingName?: string | null
  floorName?: string | null
  unitName?: string | null
  clientSlug?: string | null
}

const buildLabel = (asset: AssetData | null) => {
  if (!asset) return 'Asset'
  const parts = [asset.buildingName, asset.floorName, asset.unitName, asset.name]
    .filter((value): value is string => Boolean(value))
  return parts.length ? parts.join(' | ') : 'Asset'
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

  const [asset, setAsset] = useState<AssetData | null>(null)
  const [loading, setLoading] = useState(false)

  const loadAsset = useCallback(async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const result = await client.fetch<AssetData | null>(ASSET_QUERY, {
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

  if (!asset) {
    return (
      <Card padding={4} radius={2} tone="caution">
        <Text>
          QR Code kann nicht angezeigt werden. Asset-Daten fehlen.
        </Text>
      </Card>
    )
  }

  if (!asset.slug) {
    return (
      <Card padding={4} radius={2} tone="caution">
        <Text>Bitte zuerst speichern &amp; Slug generieren.</Text>
      </Card>
    )
  }

  if (!asset.clientSlug) {
    return (
      <Card padding={4} radius={2} tone="caution">
        <Text>
          QR Code kann nicht angezeigt werden. Bitte Mandant mit Slug am Gebäude
          zuweisen.
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
              <a
                href={chatUrl}
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
                {chatUrl}
              </a>
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
