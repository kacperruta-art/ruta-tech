'use client'

import { Button, Card, Flex, Grid, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'
import type { UserViewComponent } from 'sanity/structure'

import { apiVersion } from '@/sanity/env'

const BASE_URL = 'https://immo.ruta-tech.ch'

type Level = 'building' | 'floor' | 'unit'

interface AssetRow {
  _id: string
  name?: string | null
  slug?: string | null
  buildingName?: string | null
  floorName?: string | null
  unitName?: string | null
  clientSlug?: string | null
}

const buildLabel = (asset: AssetRow) => {
  const parts = [asset.buildingName, asset.floorName, asset.unitName, asset.name]
    .filter((value): value is string => Boolean(value))
  return parts.length ? parts.join(' | ') : 'Asset'
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
          body > :not(.qr-print-container),
          nav, header, aside, button { display: none !important; }
          .qr-print-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr);
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
            background: white;
            z-index: 9999;
          }
          .page-break { page-break-inside: avoid; }
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

  if (loading) {
    return (
      <Card padding={4} radius={2} tone="default">
        <Text muted>Lade Assets…</Text>
      </Card>
    )
  }

  if (!assets.length) {
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
          <div className="qr-print-container">
            <Grid columns={[2, 3, 4]} gap={3}>
              {assets.map((asset) => {
                if (!asset.slug) {
                  return (
                    <Card
                      key={asset._id}
                      padding={3}
                      radius={2}
                      tone="caution"
                      className="page-break"
                      style={{
                        breakInside: 'avoid',
                        minHeight: 160,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size={1} weight="medium" style={{ textAlign: 'center' }}>
                        Bitte zuerst speichern &amp; Slug generieren.
                      </Text>
                      <Text size={1} muted style={{ textAlign: 'center' }}>
                        {asset.name || 'Asset'}
                      </Text>
                    </Card>
                  )
                }

                if (!asset.clientSlug) {
                  return (
                    <Card
                      key={asset._id}
                      padding={3}
                      radius={2}
                      tone="caution"
                      className="page-break"
                      style={{
                        breakInside: 'avoid',
                        minHeight: 160,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size={1} weight="medium" style={{ textAlign: 'center' }}>
                        Mandant mit Slug fehlt.
                      </Text>
                      <Text size={1} muted style={{ textAlign: 'center' }}>
                        {asset.name || 'Asset'}
                      </Text>
                    </Card>
                  )
                }

                const url = `${BASE_URL}/${asset.clientSlug}/chat/${asset.slug}`
                const label = buildLabel(asset)
                return (
                  <Card
                    key={asset._id}
                    padding={3}
                    radius={2}
                    tone="default"
                    className="page-break"
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
                        <QRCodeSVG value={url} size={120} level="H" />
                      </div>
                      <Text size={1} weight="medium" style={{ textAlign: 'center' }}>
                        {label}
                      </Text>
                    </Flex>
                  </Card>
                )
              })}
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
