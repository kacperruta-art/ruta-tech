'use client'

import React, {useEffect, useState} from 'react'
import {QRCodeSVG} from 'qrcode.react'
import {
  Card,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
  Button,
  Box,
  Spinner,
} from '@sanity/ui'
import {useClient} from 'sanity'
import {Printer, Copy} from 'lucide-react'

// ── Types ────────────────────────────────────────────────

type ChildItem = {
  _id: string
  _type: string
  name: string
  slug?: {current: string}
  qrCodeId?: {current: string}
}

interface DocumentDisplayed {
  _id: string
  _type: string
  name?: string
  title?: string
  slug?: {current: string}
  qrCodeId?: {current: string}
  tenant?: {_ref: string}
}

// ── Container types that display a child grid ────────────

const CONTAINER_TYPES = [
  'property',
  'building',
  'floor',
  'unit',
  'parkingFacility',
  'outdoorArea',
]

// ── Child queries per container type ─────────────────────

function getChildQuery(docType: string): string {
  switch (docType) {
    case 'unit':
      return `*[_type == "asset" && location._ref == $id] { _id, _type, name, qrCodeId, slug } | order(name asc)`
    case 'floor':
      return `*[_type == "unit" && floor._ref == $id] { _id, _type, name, qrCodeId, slug } | order(name asc)`
    case 'building':
      return `*[
        (_type == "floor" && building._ref == $id) ||
        (_type == "asset" && location._ref == $id)
      ] { _id, _type, name, qrCodeId, slug } | order(_type desc, name asc)`
    case 'property':
      return `*[_type == "building" && property._ref == $id] { _id, _type, name, qrCodeId, slug } | order(name asc)`
    case 'parkingFacility':
      return `*[_type == "parkingSpot" && facility._ref == $id] { _id, _type, "name": coalesce(name, "Platz " + string(number)), qrCodeId, slug } | order(name asc)`
    case 'outdoorArea':
      return `*[_type == "asset" && location._ref == $id] { _id, _type, name, qrCodeId, slug } | order(name asc)`
    default:
      return ''
  }
}

// ── Component ────────────────────────────────────────────

export function QRGenerator(props: {
  documentId: string
  document: {displayed: DocumentDisplayed}
}) {
  const {documentId, document} = props
  const displayed = document.displayed
  const client = useClient({apiVersion: '2024-01-01'})

  const [baseUrl, setBaseUrl] = useState('https://app.ruta-tech.ch')
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [children, setChildren] = useState<ChildItem[]>([])
  const [loading, setLoading] = useState(true)

  const isContainer = CONTAINER_TYPES.includes(displayed._type)

  // 1. Environment Detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      if (host === 'localhost' || host === '127.0.0.1') {
        setBaseUrl(`http://${host}:3000`)
      }
    }
  }, [])

  // 2. Fetch Tenant Slug + Children
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // A. Tenant Slug
        let tSlug: string | null = null
        if (displayed.tenant?._ref) {
          tSlug = await client.fetch<string | null>(
            `*[_type == "tenant" && _id == $id][0].slug.current`,
            {id: displayed.tenant._ref.replace('drafts.', '')}
          )
        }
        setTenantSlug(tSlug)

        // B. Children (only for container types)
        const cleanId = displayed._id?.replace('drafts.', '')
        const query = getChildQuery(displayed._type)
        if (query && cleanId) {
          const res = await client.fetch<ChildItem[]>(query, {id: cleanId})
          setChildren(res || [])
        } else {
          setChildren([])
        }
      } catch (err) {
        console.error('[QRGenerator] Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [displayed._id, displayed._type, displayed.tenant?._ref, client])

  // Helper: build a chat URL for any item
  const getUrl = (item: {
    _id: string
    slug?: {current: string}
    qrCodeId?: {current: string}
  }): string => {
    if (!tenantSlug) return ''
    const slug =
      item.slug?.current ||
      item.qrCodeId?.current ||
      item._id.replace('drafts.', '')
    return `${baseUrl}/${tenantSlug}/chat/${slug}`
  }

  const masterUrl = getUrl(displayed)

  // ── Loading State ──────────────────────────────────────

  if (loading) {
    return (
      <Box padding={5}>
        <Flex align="center" justify="center">
          <Spinner muted />
        </Flex>
      </Box>
    )
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <Box padding={4}>
      <Stack space={5}>
        {/* ── MASTER QR (The Container / Asset) ──────── */}
        <Card padding={4} radius={3} shadow={2} tone="primary">
          <Flex direction="column" align="center" gap={4}>
            <Heading size={3} style={{color: 'white'}}>
              {isContainer ? 'Standort-QR: ' : ''}
              {displayed.name || displayed.title || 'Unbenannt'}
            </Heading>

            <Card padding={3} radius={2} style={{background: 'white'}}>
              {masterUrl ? (
                <QRCodeSVG value={masterUrl} size={200} level="H" />
              ) : (
                <Box padding={4}>
                  <Text align="center" muted>
                    Kein Mandant verknuepft. URL kann nicht generiert werden.
                  </Text>
                </Box>
              )}
            </Card>

            {masterUrl && (
              <Text
                size={1}
                style={{
                  color: 'white',
                  opacity: 0.8,
                  wordBreak: 'break-all',
                  textAlign: 'center',
                }}
              >
                {masterUrl}
              </Text>
            )}

            <Flex gap={3}>
              <Button
                icon={Printer}
                text="Standort-QR Drucken"
                mode="ghost"
                style={{color: 'white'}}
                onClick={() => window.print()}
              />
              {masterUrl && (
                <Button
                  icon={Copy}
                  text="URL Kopieren"
                  mode="ghost"
                  style={{color: 'white'}}
                  onClick={() => navigator.clipboard.writeText(masterUrl)}
                />
              )}
            </Flex>
          </Flex>
        </Card>

        {/* ── CHILDREN GRID (The Inventory) ──────────── */}
        {children.length > 0 && (
          <Stack space={3}>
            <Heading size={1}>
              Enthaltene Objekte ({children.length})
            </Heading>
            <Grid columns={[1, 2, 3, 4]} gap={3}>
              {children.map((child) => {
                const childUrl = getUrl(child)
                return (
                  <Card
                    key={child._id}
                    padding={3}
                    radius={2}
                    border
                    tone="default"
                  >
                    <Flex direction="column" align="center" gap={3}>
                      <Text
                        size={1}
                        weight="bold"
                        style={{textAlign: 'center'}}
                      >
                        {child.name || 'Unbenannt'}
                      </Text>
                      <Box padding={2} style={{background: 'white'}}>
                        {childUrl ? (
                          <QRCodeSVG value={childUrl} size={100} />
                        ) : (
                          <Text size={0} muted>
                            —
                          </Text>
                        )}
                      </Box>
                      <Text
                        size={0}
                        muted
                        style={{
                          wordBreak: 'break-all',
                          textAlign: 'center',
                        }}
                      >
                        {child._type}
                      </Text>
                    </Flex>
                  </Card>
                )
              })}
            </Grid>
          </Stack>
        )}

        {/* ── Empty state for containers ──────────────── */}
        {children.length === 0 && isContainer && (
          <Card padding={3} tone="transparent" border>
            <Text muted align="center">
              Keine untergeordneten Objekte gefunden.
            </Text>
          </Card>
        )}
      </Stack>

      {/* ── Print Styles ─────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .qr-print-label, .qr-print-label * { visibility: visible !important; }
          .qr-print-label {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
      {masterUrl && (
        <div className="qr-print-label" style={{display: 'none'}}>
          <div style={{textAlign: 'center'}}>
            <QRCodeSVG value={masterUrl} size={300} level="H" />
            <p style={{fontFamily: 'monospace', fontSize: 14, marginTop: 12}}>
              {displayed.name || displayed.title || 'Asset'}
            </p>
            <p style={{fontFamily: 'monospace', fontSize: 10, color: '#666'}}>
              {masterUrl}
            </p>
          </div>
        </div>
      )}
    </Box>
  )
}
