'use client'

import { Button, Card, Flex, Grid, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserViewComponent } from 'sanity/structure'

import { apiVersion } from '@/sanity/env'

const BASE_URL = 'https://immo.ruta-tech.ch'

type Level = 'building' | 'floor' | 'unit'

type AssetRow = {
  _id: string
  name?: string
  slug?: string
  buildingName?: string
  floorName?: string
  unitName?: string
  clientSlug?: string
}

type QrCard = AssetRow & { url: string; label: string }

const buildLabel = (asset: AssetRow) => {
  const parts = [
    asset.buildingName,
    asset.floorName,
    asset.unitName,
    asset.name,
  ].filter(Boolean)
  return parts.join(' | ')
}

const getAssetsQuery = (level: Level) => {
  if (level === 'unit') {
    return `*[_type == "asset" && parentUnit._ref in [$id, $baseId]] | order(name asc){
      _id,
      name,
      "slug": slug.current,
      "buildingName": building->name,
      "floorName": parentFloor->name,
      "unitName": parentUnit->name,
      "clientSlug": building->client->slug.current
    }`
  }
  if (level === 'floor') {
    return `*[_type == "asset" && parentFloor._ref in [$id, $baseId]] | order(name asc){
      _id,
      name,
      "slug": slug.current,
      "buildingName": building->name,
      "floorName": parentFloor->name,
      "unitName": parentUnit->name,
      "clientSlug": building->client->slug.current
    }`
  }
  return `*[_type == "asset" && building._ref in [$id, $baseId]] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    "buildingName": building->name,
    "floorName": parentFloor->name,
    "unitName": parentUnit->name,
    "clientSlug": building->client->slug.current
  }`
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
            overflow: auto !important;
            z-index: 2147483647 !important;
            padding: 24px !important;
          }
          .no-print { display: none !important; }
        }
      `}
    </style>
  )
}

type ViewOptions = { level?: Level }

export const QRBatchList: UserViewComponent = (props) => {
  const { documentId, options } = props
  const client = useClient({ apiVersion })
  const level = (options as ViewOptions | undefined)?.level ?? 'building'

  const [assets, setAssets] = useState<AssetRow[]>([])
  const [loading, setLoading] = useState(false)

  const loadAssets = useCallback(async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const id = String(documentId)
      const baseId = id.replace(/^drafts\./, '')
      const query = getAssetsQuery(level)
      const result = await client.fetch<AssetRow[]>(query, { id, baseId })
      setAssets(result || [])
    } catch {
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [client, documentId, level])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const cards = useMemo(() => {
    return assets.reduce<QrCard[]>((acc, asset) => {
      if (!asset.slug || !asset.clientSlug) return acc
      acc.push({
        ...asset,
        url: `${BASE_URL}/${asset.clientSlug}/chat/${asset.slug}`,
        label: buildLabel(asset),
      })
      return acc
    }, [])
  }, [assets])

  if (loading) {
    return (
      <Card padding={4} radius={2} tone="default">
        <Text muted>Lade Assets…</Text>
      </Card>
    )
  }

  if (!cards.length) {
    return (
      <Card padding={4} radius={2} tone="default">
        <Text muted>Keine Assets gefunden.</Text>
      </Card>
    )
  }

  return (
    <>
      <PrintStyles />
      <Card padding={4} radius={2} tone="default">
        <Flex direction="column" gap={4}>
          <div className="qr-print-area">
            <Grid columns={[2, 3, 4]} gap={3}>
              {cards.map((asset) => (
                <Card
                  key={asset._id}
                  padding={3}
                  radius={2}
                  tone="default"
                  style={{
                    breakInside: 'avoid',
                    minHeight: 160,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Flex align="center" direction="column" gap={2}>
                    <div style={{ padding: 8, background: 'white' }}>
                      <QRCodeSVG value={asset.url} size={120} level="H" />
                    </div>
                    <Text size={1} weight="medium" style={{ textAlign: 'center' }}>
                      {asset.label}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Grid>
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
