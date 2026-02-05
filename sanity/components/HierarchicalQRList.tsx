'use client'

import { Button, Card, Flex, Grid, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserViewComponent } from 'sanity/structure'

import { apiVersion } from '@/sanity/env'

const BASE_URL = 'https://immo.ruta-tech.ch'

type Level = 'building' | 'floor' | 'unit'

interface QrEntity {
  _id: string
  name?: string | null
  slug?: string | null
  clientSlug?: string | null
}

interface AssetRow {
  _id: string
  name?: string | null
  slug?: string | null
  buildingName?: string | null
  floorName?: string | null
  unitName?: string | null
  clientSlug?: string | null
}

interface UnitGroup extends QrEntity {
  assets: AssetRow[]
}

interface FloorGroup extends QrEntity {
  assets: AssetRow[]
  units: UnitGroup[]
}

interface BuildingPayload {
  parent?: QrEntity | null
  directAssets: AssetRow[]
  floors: FloorGroup[]
}

interface FloorPayload {
  parent?: QrEntity | null
  directAssets: AssetRow[]
  units: UnitGroup[]
}

interface UnitPayload {
  parent?: QrEntity | null
  directAssets: AssetRow[]
}

const buildAssetLabel = (asset: AssetRow) => {
  const parts = [asset.buildingName, asset.floorName, asset.unitName, asset.name]
    .filter((value): value is string => Boolean(value))
  return parts.length ? parts.join(' | ') : asset.name || 'Asset'
}

const getEntityUrl = (entity: QrEntity) => {
  if (!entity.slug || !entity.clientSlug) return ''
  return `${BASE_URL}/${entity.clientSlug}/chat/${entity.slug}`
}

const getBuildingQuery = () => `{
  "parent": *[_id in [$id, $baseId]][0]{
    _id,
    name,
    "slug": slug.current,
    "clientSlug": client->slug.current
  },
  "directAssets": *[_type == "asset" && building._ref in [$id, $baseId] && !defined(parentFloor)] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    "buildingName": building->name,
    "floorName": parentFloor->name,
    "unitName": parentUnit->name,
    "clientSlug": building->client->slug.current
  },
  "floors": *[_type == "floor" && building._ref in [$id, $baseId]] | order(level asc, name asc){
    _id,
    name,
    "slug": slug.current,
    "clientSlug": building->client->slug.current,
    "assets": *[_type == "asset" && parentFloor._ref == ^._id && !defined(parentUnit)] | order(name asc){
      _id,
      name,
      "slug": slug.current,
      "buildingName": building->name,
      "floorName": parentFloor->name,
      "unitName": parentUnit->name,
      "clientSlug": building->client->slug.current
    },
    "units": *[_type == "unit" && floor._ref == ^._id] | order(name asc){
      _id,
      name,
      "slug": slug.current,
      "clientSlug": building->client->slug.current,
      "assets": *[_type == "asset" && parentUnit._ref == ^._id] | order(name asc){
        _id,
        name,
        "slug": slug.current,
        "buildingName": building->name,
        "floorName": parentFloor->name,
        "unitName": parentUnit->name,
        "clientSlug": building->client->slug.current
      }
    }
  }
}`

const getFloorQuery = () => `{
  "parent": *[_id in [$id, $baseId]][0]{
    _id,
    name,
    "slug": slug.current,
    "clientSlug": building->client->slug.current
  },
  "directAssets": *[_type == "asset" && parentFloor._ref in [$id, $baseId] && !defined(parentUnit)] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    "buildingName": building->name,
    "floorName": parentFloor->name,
    "unitName": parentUnit->name,
    "clientSlug": building->client->slug.current
  },
  "units": *[_type == "unit" && floor._ref in [$id, $baseId]] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    "clientSlug": building->client->slug.current,
    "assets": *[_type == "asset" && parentUnit._ref == ^._id] | order(name asc){
      _id,
      name,
      "slug": slug.current,
      "buildingName": building->name,
      "floorName": parentFloor->name,
      "unitName": parentUnit->name,
      "clientSlug": building->client->slug.current
    }
  }
}`

const getUnitQuery = () => `{
  "parent": *[_id in [$id, $baseId]][0]{
    _id,
    name,
    "slug": slug.current,
    "clientSlug": building->client->slug.current
  },
  "directAssets": *[_type == "asset" && parentUnit._ref in [$id, $baseId]] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    "buildingName": building->name,
    "floorName": parentFloor->name,
    "unitName": parentUnit->name,
    "clientSlug": building->client->slug.current
  }
}`

function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
          body * { visibility: hidden; }
          .qr-print-wrapper, .qr-print-wrapper * { visibility: visible; }
          .qr-print-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            background: white;
          }
          .qr-section {
            page-break-inside: avoid;
            margin-bottom: 1cm;
          }
          .qr-section-title {
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 8px;
          }
          .qr-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.8cm;
          }
          .qr-card {
            border: 1px dashed #ccc;
            padding: 10px;
            text-align: center;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .warning-card, .no-print, button { display: none !important; }
        }
      `}
    </style>
  )
}

type ViewOptions = { level?: Level }

export const HierarchicalQRList: UserViewComponent = (props) => {
  const { documentId, options } = props
  const client = useClient({ apiVersion })
  const level = (options as ViewOptions | undefined)?.level ?? 'building'

  const [buildingData, setBuildingData] = useState<BuildingPayload | null>(null)
  const [floorData, setFloorData] = useState<FloorPayload | null>(null)
  const [unitData, setUnitData] = useState<UnitPayload | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const id = String(documentId)
      const baseId = id.replace(/^drafts\./, '')
      if (level === 'building') {
        const result = await client.fetch<BuildingPayload>(getBuildingQuery(), {
          id,
          baseId,
        })
        setBuildingData(result)
        setFloorData(null)
        setUnitData(null)
      } else if (level === 'floor') {
        const result = await client.fetch<FloorPayload>(getFloorQuery(), {
          id,
          baseId,
        })
        setFloorData(result)
        setBuildingData(null)
        setUnitData(null)
      } else {
        const result = await client.fetch<UnitPayload>(getUnitQuery(), {
          id,
          baseId,
        })
        setUnitData(result)
        setBuildingData(null)
        setFloorData(null)
      }
    } catch {
      setBuildingData(null)
      setFloorData(null)
      setUnitData(null)
    } finally {
      setLoading(false)
    }
  }, [client, documentId, level])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderEntityQr = (entity: QrEntity, label: string) => {
    const url = getEntityUrl(entity)
    if (!entity.slug || !entity.clientSlug) {
      return (
        <Card padding={3} radius={2} tone="caution" className="warning-card">
          <Text size={1}>{label}: Bitte zuerst speichern &amp; Slug generieren.</Text>
        </Card>
      )
    }
    return (
      <Card padding={3} radius={2} tone="default" className="qr-card">
        <Text size={1} weight="semibold">
          {label}
        </Text>
        <div style={{ padding: 8, background: 'white' }}>
          <QRCodeSVG value={url} size={110} level="H" />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            marginTop: 6,
            fontSize: '0.8rem',
            color: 'blue',
            textDecoration: 'underline',
            cursor: 'pointer',
            wordBreak: 'break-all',
            textAlign: 'center',
          }}
        >
          {url}
        </a>
      </Card>
    )
  }

  const renderAssetCard = (asset: AssetRow) => {
    if (!asset.slug || !asset.clientSlug) {
      return (
        <Card
          key={asset._id}
          padding={3}
          radius={2}
          tone="caution"
          className="warning-card"
        >
          <Text size={1}>Bitte zuerst speichern &amp; Slug generieren.</Text>
          <Text size={1} muted>
            {asset.name || 'Asset'}
          </Text>
        </Card>
      )
    }
    const url = `${BASE_URL}/${asset.clientSlug}/chat/${asset.slug}`
    return (
      <Card key={asset._id} padding={3} radius={2} tone="default" className="qr-card">
        <div style={{ padding: 6, background: 'white' }}>
          <QRCodeSVG value={url} size={110} level="H" />
        </div>
        <Text size={1} weight="medium" style={{ textAlign: 'center' }}>
          {buildAssetLabel(asset)}
        </Text>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            marginTop: 6,
            fontSize: '0.8rem',
            color: 'blue',
            textDecoration: 'underline',
            cursor: 'pointer',
            wordBreak: 'break-all',
            textAlign: 'center',
          }}
        >
          {url}
        </a>
      </Card>
    )
  }

  const hasContent = useMemo(() => {
    if (level === 'building') {
      return (
        buildingData?.directAssets.length ||
        buildingData?.floors.length
      )
    }
    if (level === 'floor') {
      return floorData?.directAssets.length || floorData?.units.length
    }
    return unitData?.directAssets.length
  }, [buildingData, floorData, level, unitData])

  if (loading) {
    return (
      <Card padding={4} radius={2} tone="default">
        <Text muted>Lade QR Katalog…</Text>
      </Card>
    )
  }

  if (!hasContent) {
    return (
      <Card padding={4} radius={2} tone="default">
        <Text muted>Keine QR-Daten gefunden.</Text>
      </Card>
    )
  }

  return (
    <>
      <PrintStyles />
      <Card padding={4} radius={2} tone="default">
        <Flex direction="column" gap={4} className="no-print">
          <Button
            mode="default"
            tone="primary"
            text="Drucken"
            onClick={() => window.print()}
          />
        </Flex>
        <div className="qr-print-wrapper">
          {(level === 'building' || level === 'floor' || level === 'unit') && (
            <div className="qr-section">
              <div className="qr-section-title">Direkte Assets</div>
              <div className="qr-grid">
                {(level === 'building'
                  ? buildingData?.directAssets
                  : level === 'floor'
                    ? floorData?.directAssets
                    : unitData?.directAssets
                )?.map(renderAssetCard)}
              </div>
            </div>
          )}

          {level === 'building' &&
            buildingData?.floors.map((floor) => (
              <div key={floor._id} className="qr-section">
                <div className="qr-section-title">
                  Ebene: {floor.name || 'Unbenannt'}
                </div>
                <Grid columns={[1, 2, 3]} gap={3} style={{ marginBottom: 12 }}>
                  {renderEntityQr(floor, 'EBENEN-CODE')}
                </Grid>
                {floor.assets.length > 0 && (
                  <div className="qr-grid">{floor.assets.map(renderAssetCard)}</div>
                )}
                {floor.units.map((unit) => (
                  <div key={unit._id} className="qr-section" style={{ marginTop: 16 }}>
                    <div className="qr-section-title">
                      Raum: {unit.name || 'Unbenannt'}
                    </div>
                    <Grid columns={[1, 2, 3]} gap={3} style={{ marginBottom: 12 }}>
                      {renderEntityQr(unit, 'RAUM-CODE')}
                    </Grid>
                    <div className="qr-grid">{unit.assets.map(renderAssetCard)}</div>
                  </div>
                ))}
              </div>
            ))}

          {level === 'floor' &&
            floorData?.units.map((unit) => (
              <div key={unit._id} className="qr-section">
                <div className="qr-section-title">
                  Raum: {unit.name || 'Unbenannt'}
                </div>
                <Grid columns={[1, 2, 3]} gap={3} style={{ marginBottom: 12 }}>
                  {renderEntityQr(unit, 'RAUM-CODE')}
                </Grid>
                <div className="qr-grid">{unit.assets.map(renderAssetCard)}</div>
              </div>
            ))}
        </div>
      </Card>
    </>
  )
}
