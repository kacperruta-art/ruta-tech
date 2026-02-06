'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Box, Card, Flex, Grid, Heading, Stack, Text, Button } from '@sanity/ui'
import { useClient } from 'sanity'

// ── Types ────────────────────────────────────────────────

interface LinkedAsset {
  _id: string
  name: string | null
  qrCodeId: { current: string } | null
  model: string | null
}

interface DocumentDisplayed {
  _id: string
  _type: string
  name?: string
  title?: string
  tenant?: { _ref: string }
  qrCodeId?: { current: string }
}

// Types that are "containers" holding assets via the polymorphic location ref
const CONTAINER_TYPES = ['building', 'floor', 'unit', 'property', 'parkingFacility']

// ── Helpers ──────────────────────────────────────────────

function stripDraftPrefix(id: string): string {
  return id.replace(/^drafts\./, '')
}

function buildChatUrl(tenantSlug: string | null, assetSlug: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const tenant = tenantSlug || '_'
  return `${origin}/${tenant}/chat/${assetSlug}`
}

// ── Component ────────────────────────────────────────────

export function QRGenerator(props: { document: { displayed: DocumentDisplayed } }) {
  const doc = props.document.displayed
  const client = useClient({ apiVersion: '2024-01-01' })

  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([])
  const [loading, setLoading] = useState(true)

  const documentId = stripDraftPrefix(doc._id)
  const isAsset = doc._type === 'asset'
  const isContainer = CONTAINER_TYPES.includes(doc._type)

  // ── Effect 1: Resolve tenant slug ──────────────────────
  useEffect(() => {
    if (!doc.tenant?._ref) {
      setTenantSlug(null)
      return
    }
    const tenantId = stripDraftPrefix(doc.tenant._ref)

    client
      .fetch<{ slug: string | null }>(
        `*[_id == $id || _id == "drafts." + $id][0]{ "slug": slug.current }`,
        { id: tenantId }
      )
      .then((res) => setTenantSlug(res?.slug ?? null))
      .catch(() => setTenantSlug(null))
  }, [client, doc.tenant?._ref])

  // ── Effect 2: Fetch linked assets (for containers) ────
  useEffect(() => {
    if (!isContainer) {
      setLinkedAssets([])
      setLoading(false)
      return
    }

    setLoading(true)
    client
      .fetch<LinkedAsset[]>(
        `*[_type == "asset" && location._ref == $docId]{
          _id, name, qrCodeId, model
        } | order(name asc)`,
        { docId: documentId }
      )
      .then((res) => {
        setLinkedAssets(res ?? [])
        setLoading(false)
      })
      .catch(() => {
        setLinkedAssets([])
        setLoading(false)
      })
  }, [client, documentId, isContainer])

  // ── Render: Single Asset QR ────────────────────────────
  if (isAsset) {
    const slug = doc.qrCodeId?.current || documentId
    const chatUrl = buildChatUrl(tenantSlug, slug)

    return (
      <Box padding={4}>
        <Card padding={5} radius={3} shadow={1} tone="default">
          <Flex direction="column" align="center" gap={4}>
            <Heading as="h2" size={2}>
              QR-Code: {doc.name || 'Unbenannt'}
            </Heading>

            <Card padding={4} radius={2} tone="transparent" style={{ background: '#fff' }}>
              <QRCodeSVG value={chatUrl} size={280} level="H" />
            </Card>

            <Text size={1} muted style={{ wordBreak: 'break-all', textAlign: 'center' }}>
              {chatUrl}
            </Text>

            {!tenantSlug && (
              <Card padding={3} radius={2} tone="caution">
                <Text size={1}>
                  Mandant hat keinen Slug. Bitte Mandant-Dokument prüfen.
                </Text>
              </Card>
            )}

            <Flex gap={3}>
              <Button
                text="Label drucken"
                tone="primary"
                onClick={() => window.print()}
              />
              <Button
                text="URL kopieren"
                mode="ghost"
                onClick={() => navigator.clipboard.writeText(chatUrl)}
              />
            </Flex>
          </Flex>
        </Card>

        {/* Print-only section */}
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
        <div className="qr-print-label" style={{ display: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <QRCodeSVG value={chatUrl} size={300} level="H" />
            <p style={{ fontFamily: 'monospace', fontSize: 14, marginTop: 12 }}>
              {doc.name || 'Asset'}
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#666' }}>
              {chatUrl}
            </p>
          </div>
        </div>
      </Box>
    )
  }

  // ── Render: Container — Master QR + Inventory Grid ──────
  if (isContainer) {
    const containerLabel = doc.name || doc.title || doc._type
    const masterUrl = buildChatUrl(tenantSlug, documentId)

    return (
      <Box padding={4}>
        <Stack space={5}>

          {/* ── Master QR (the container itself) ──────────── */}
          <Card padding={5} radius={3} shadow={2} tone="primary">
            <Flex direction="column" align="center" gap={4}>
              <Heading as="h2" size={3}>
                Standort-QR: {containerLabel}
              </Heading>

              <Card padding={4} radius={2} tone="transparent" style={{ background: '#fff' }}>
                <QRCodeSVG value={masterUrl} size={260} level="H" />
              </Card>

              <Text size={1} muted style={{ wordBreak: 'break-all', textAlign: 'center' }}>
                {masterUrl}
              </Text>

              {!tenantSlug && (
                <Card padding={3} radius={2} tone="caution">
                  <Text size={1}>
                    Mandant hat keinen Slug. Bitte Mandant-Dokument prüfen.
                  </Text>
                </Card>
              )}

              <Flex gap={3}>
                <Button
                  text="Standort-QR drucken"
                  tone="primary"
                  onClick={() => window.print()}
                />
                <Button
                  text="URL kopieren"
                  mode="ghost"
                  onClick={() => navigator.clipboard.writeText(masterUrl)}
                />
              </Flex>
            </Flex>
          </Card>

          {/* Print-only: Master QR */}
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
          <div className="qr-print-label" style={{ display: 'none' }}>
            <div style={{ textAlign: 'center' }}>
              <QRCodeSVG value={masterUrl} size={300} level="H" />
              <p style={{ fontFamily: 'monospace', fontSize: 14, marginTop: 12 }}>
                {containerLabel}
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#666' }}>
                {masterUrl}
              </p>
            </div>
          </div>

          {/* ── Divider ───────────────────────────────────── */}
          <Card borderBottom padding={0} />

          {/* ── Inventory Grid (child assets) ─────────────── */}
          <Stack space={4}>
            <Heading as="h3" size={1}>
              Zugeordnete Assets
            </Heading>

            {loading && (
              <Card padding={4} tone="transparent">
                <Text size={2} muted>Lade Assets…</Text>
              </Card>
            )}

            {!loading && linkedAssets.length === 0 && (
              <Card padding={4} radius={2} tone="transparent">
                <Text size={2} muted>
                  Keine Assets an diesem Standort zugeordnet.
                </Text>
              </Card>
            )}

            {!loading && linkedAssets.length > 0 && (
              <>
                <Text size={1} muted>
                  {linkedAssets.length} Asset{linkedAssets.length !== 1 ? 's' : ''} gefunden
                </Text>
                <Grid columns={[1, 2, 3]} gap={4}>
                  {linkedAssets.map((asset) => {
                    const slug = asset.qrCodeId?.current || stripDraftPrefix(asset._id)
                    const chatUrl = buildChatUrl(tenantSlug, slug)

                    return (
                      <Card key={asset._id} padding={3} radius={2} shadow={1} tone="default">
                        <Flex direction="column" align="center" gap={3}>
                          <Card
                            padding={2}
                            radius={2}
                            tone="transparent"
                            style={{ background: '#fff' }}
                          >
                            <QRCodeSVG value={chatUrl} size={140} level="M" />
                          </Card>
                          <Text size={1} weight="bold" align="center">
                            {asset.name || 'Unbenannt'}
                          </Text>
                          {asset.model && (
                            <Text size={0} muted align="center">
                              {asset.model}
                            </Text>
                          )}
                          <Text
                            size={0}
                            muted
                            style={{
                              wordBreak: 'break-all',
                              textAlign: 'center',
                              maxWidth: '100%',
                            }}
                          >
                            {chatUrl}
                          </Text>
                        </Flex>
                      </Card>
                    )
                  })}
                </Grid>
              </>
            )}
          </Stack>

        </Stack>
      </Box>
    )
  }

  // ── Fallback ───────────────────────────────────────────
  return (
    <Box padding={4}>
      <Card padding={4} radius={2} tone="transparent">
        <Text muted>
          QR-Ansicht ist für diesen Dokumenttyp ({doc._type}) nicht verfügbar.
        </Text>
      </Card>
    </Box>
  )
}
