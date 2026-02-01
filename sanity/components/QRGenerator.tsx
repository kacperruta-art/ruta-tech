'use client'

import { Button, Card, Flex, Grid, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { UserViewComponent } from 'sanity/structure'

import { apiVersion } from '@/sanity/env'

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

const ASSETS_QUERY = `*[_type == "asset" && defined(location) && (location->parentFloor->parentSection->parentProperty._ref == $id || location->parentFloor->parentSection->parentProperty._ref == $baseId)] | order(name asc) {
  _id,
  name,
  "slug": publicId.current
}`

const ASSET_OWNER_QUERY = `*[_id == $id || _id == $baseId][0]{
  "slug": publicId.current,
  "clientSlug": location->parentFloor->parentSection->parentProperty->owner->slug.current
}`

const PROPERTY_OWNER_QUERY = `*[_id == $id || _id == $baseId][0]{
  "ownerSlug": owner->slug.current
}`

type AssetRow = { _id: string; name?: string; slug?: string }
type AssetOwnerResult = { slug?: string; clientSlug?: string } | null
type PropertyOwnerResult = { ownerSlug?: string } | null

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

export const QRGenerator: UserViewComponent = (props) => {
  const { document } = props
  const displayed = document?.displayed
  const documentId = props.documentId
  const schemaType = props.schemaType
  const client = useClient({ apiVersion })

  const [assets, setAssets] = useState<AssetRow[]>([])
  const [loading, setLoading] = useState(false)
  const [assetOwner, setAssetOwner] = useState<AssetOwnerResult>(null)
  const [propertyOwnerSlug, setPropertyOwnerSlug] = useState<string | null>(null)

  const docType =
    typeof schemaType === 'string'
      ? schemaType
      : (schemaType as { name?: string })?.name ?? ''
  const displayedPublicId = displayed as { publicId?: { current?: string } } | undefined
  const slug =
    docType === 'asset' && displayedPublicId?.publicId?.current
      ? displayedPublicId.publicId.current
      : undefined
  const displayedDoc = displayed as { name?: string; title?: string } | undefined
  const title: string =
    typeof displayedDoc?.name === 'string'
      ? displayedDoc.name
      : typeof displayedDoc?.title === 'string'
        ? displayedDoc.title
        : ''

  const chatUrl = useMemo(
    () =>
      slug && assetOwner?.clientSlug
        ? `${BASE_URL}/${assetOwner.clientSlug}/chat/${slug}`
        : '',
    [slug, assetOwner?.clientSlug]
  )

  const loadAssetOwner = useCallback(async () => {
    if (docType !== 'asset' || !documentId) return
    try {
      const id = String(documentId)
      const baseId = id.replace(/^drafts\./, '')
      const result = await client.fetch<AssetOwnerResult>(
        ASSET_OWNER_QUERY,
        { id, baseId }
      )
      setAssetOwner(result)
    } catch {
      setAssetOwner(null)
    }
  }, [client, documentId, docType])

  const loadPropertyAssets = useCallback(async () => {
    if (docType !== 'property' || !documentId) return
    setLoading(true)
    try {
      const id = String(documentId)
      const baseId = id.replace(/^drafts\./, '')
      const [assetsResult, ownerResult] = await Promise.all([
        client.fetch<AssetRow[]>(ASSETS_QUERY, { id, baseId }),
        client.fetch<PropertyOwnerResult>(PROPERTY_OWNER_QUERY, { id, baseId }),
      ])
      setAssets(assetsResult || [])
      setPropertyOwnerSlug(ownerResult?.ownerSlug ?? null)
    } catch {
      setAssets([])
      setPropertyOwnerSlug(null)
    } finally {
      setLoading(false)
    }
  }, [client, documentId, docType])

  useEffect(() => {
    if (docType === 'asset') {
      loadAssetOwner()
    }
  }, [docType, loadAssetOwner])

  useEffect(() => {
    if (docType === 'property') {
      loadPropertyAssets()
    }
  }, [docType, loadPropertyAssets])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  if (docType === 'asset') {
    if (!slug || !assetOwner?.clientSlug) {
      return (
        <Card padding={4} radius={2} tone="caution">
          <Text>
            {!slug
              ? 'Generate a QR Code ID (slug) in the form to see the QR code.'
              : 'Assign this asset to a property with an owner (client) that has a slug.'}
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
              {title || 'Asset'}
            </Text>
            <div className="qr-print-area">
              <Flex align="center" direction="column" gap={3}>
                <Text size={2} weight="medium">
                  {title || 'Asset'}
                </Text>
                <div style={{ padding: 16, background: 'white' }}>
                  <QRCodeSVG value={chatUrl} size={256} level="H" />
                </div>
                <Text size={1} muted>
                  {chatUrl}
                </Text>
              </Flex>
            </div>
            <Button
              className="no-print"
              mode="default"
              tone="primary"
              text="Print Label"
              onClick={handlePrint}
            />
          </Flex>
        </Card>
      </>
    )
  }

  if (docType === 'property') {
    return (
      <>
        <PrintStyles />
        <Card padding={4} radius={2} tone="default">
          <Flex direction="column" gap={4}>
            <Text
              size={3}
              weight="semibold"
              className="no-print"
            >
              {title ? `${title} – QR Codes` : 'Asset QR Codes'}
            </Text>
            {loading ? (
              <Text muted>Loading assets…</Text>
            ) : !propertyOwnerSlug ? (
              <Text muted>
                Assign an owner (client) with a slug to this property to generate
                QR codes.
              </Text>
            ) : assets.length === 0 ? (
              <Text muted>No assets linked to this property yet.</Text>
            ) : (
              <>
                <div className="qr-print-area">
                  {title && (
                    <Text size={2} weight="semibold" style={{ marginBottom: 16 }}>
                      {title} – QR Code Labels
                    </Text>
                  )}
                  <Grid columns={[2, 3, 4]} gap={3}>
                  {assets.map((asset) => {
                    const url =
                      asset.slug && propertyOwnerSlug
                        ? `${BASE_URL}/${propertyOwnerSlug}/chat/${asset.slug}`
                        : ''
                    if (!url) return null
                    return (
                      <Card
                        key={asset._id}
                        padding={3}
                        radius={2}
                        tone="default"
                        style={{
                          breakInside: 'avoid',
                          minHeight: 140,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Flex
                          align="center"
                          direction="column"
                          gap={2}
                          style={{ width: '100%' }}
                        >
                          <Text size={1} weight="medium">
                            {asset.name || asset.slug || 'Asset'}
                          </Text>
                          <div style={{ padding: 8, background: 'white' }}>
                            <QRCodeSVG value={url} size={120} level="H" />
                          </div>
                          <Text size={0} muted style={{ fontSize: 10 }}>
                            {asset.slug}
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
                  text="Print All"
                  onClick={handlePrint}
                  disabled={assets.length === 0}
                />
              </>
            )}
          </Flex>
        </Card>
      </>
    )
  }

  return null
}
