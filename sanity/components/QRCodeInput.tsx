'use client'

import React, {useCallback, useEffect, useState} from 'react'
import {QRCodeSVG} from 'qrcode.react'
import {Card, Flex, Text, Button, Box, Stack, useToast, Spinner} from '@sanity/ui'
import {Printer, Copy, QrCode, AlertTriangle} from 'lucide-react'
import {useFormValue, useClient} from 'sanity'

export const QRCodeInput = () => {
  const toast = useToast()
  const client = useClient({apiVersion: '2024-01-01'})

  // 1. Get Form Data
  const docId = useFormValue(['_id']) as string
  const docType = useFormValue(['_type']) as string
  const docName =
    (useFormValue(['name']) as string) ||
    (useFormValue(['title']) as string) ||
    'Unbenannt'
  const docSlug = (useFormValue(['slug']) as any)?.current
  const tenantRef = useFormValue(['tenant']) as any

  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [baseUrl, setBaseUrl] = useState('https://app.ruta-tech.ch')

  // Clean ID for fallback
  const cleanId = docId?.replace('drafts.', '')

  // Prefer Slug over ID for nicer URLs
  const finalAssetSlug = docSlug || cleanId

  // 2a. Environment Detection — use localhost URL during development
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      if (host === 'localhost' || host === '127.0.0.1') {
        setBaseUrl(`http://${host}:3000`)
      }
    }
  }, [])

  // 2b. Fetch Tenant Slug (Async)
  useEffect(() => {
    if (!tenantRef?._ref) {
      setTenantSlug(null)
      return
    }
    setLoading(true)
    client
      .fetch(`*[_type == "tenant" && _id == $id][0].slug.current`, {
        id: tenantRef._ref,
      })
      .then((slug: string | null) => {
        setTenantSlug(slug)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantRef, client])

  // 3. Construct the REAL URL (adapts to localhost or production)
  const qrValue = tenantSlug
    ? `${baseUrl}/${tenantSlug}/chat/${finalAssetSlug}`
    : null

  const handleCopy = useCallback(() => {
    if (qrValue) {
      navigator.clipboard.writeText(qrValue)
      toast.push({status: 'success', title: 'Link kopiert'})
    }
  }, [qrValue, toast])

  const handlePrint = useCallback(() => {
    alert(`Druckauftrag fuer ${docName} gesendet!`)
  }, [docName])

  // 4. Render States

  // Not yet saved
  if (!cleanId) {
    return (
      <Card padding={4} tone="caution" radius={2}>
        <Flex align="center" gap={3}>
          <AlertTriangle size={18} />
          <Text size={1}>Bitte zuerst speichern.</Text>
        </Flex>
      </Card>
    )
  }

  // Fetching tenant slug
  if (loading) {
    return (
      <Card padding={5} radius={2}>
        <Flex align="center" justify="center">
          <Spinner muted />
        </Flex>
      </Card>
    )
  }

  // CRITICAL: Prevent generating broken links if no tenant is linked
  if (!tenantSlug) {
    return (
      <Card padding={4} tone="caution" radius={2} shadow={1}>
        <Flex direction="column" gap={3} align="center">
          <AlertTriangle size={24} color="#d4a017" />
          <Text size={2} weight="bold">
            Kein Mandant verknuepft!
          </Text>
          <Text size={1} muted style={{textAlign: 'center'}}>
            Bitte weisen Sie einen Mandanten zu, um den QR-Code zu generieren.
          </Text>
        </Flex>
      </Card>
    )
  }

  return (
    <Card padding={4} radius={3} shadow={1} tone="default">
      <Flex direction="column" gap={4}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Stack space={2}>
            <Text
              size={1}
              weight="semibold"
              style={{textTransform: 'uppercase', color: '#6e7683'}}
            >
              Digitale Identitaet
            </Text>
            <Text size={2} weight="bold">
              {docName}
            </Text>
          </Stack>
          <Box
            padding={2}
            style={{background: '#f2f3f5', borderRadius: '50%'}}
          >
            <QrCode size={20} color="#6e7683" />
          </Box>
        </Flex>

        {/* Sticker Simulation */}
        <Card
          padding={4}
          radius={2}
          tone="transparent"
          style={{
            background: 'white',
            border: '2px solid #101112',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack space={4} style={{alignItems: 'center', width: '100%'}}>
            {/* Top Label */}
            <Text
              size={1}
              weight="bold"
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'black',
                textAlign: 'center',
              }}
            >
              {docType} &bull; {tenantSlug.toUpperCase()}
            </Text>

            {/* QR Code */}
            {qrValue && <QRCodeSVG value={qrValue} size={160} level="H" />}

            {/* Clickable Link */}
            <a
              href={qrValue || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <Text
                size={1}
                style={{
                  color: '#2276fc',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Link oeffnen &#8599;
              </Text>
            </a>
          </Stack>
        </Card>

        {/* Actions */}
        <Flex gap={2} wrap="wrap">
          <Button icon={Copy} text="Kopieren" mode="ghost" onClick={handleCopy} />
          <div style={{flex: 1}} />
          <Button
            icon={Printer}
            text="Drucken"
            tone="primary"
            onClick={handlePrint}
          />
        </Flex>
      </Flex>
    </Card>
  )
}
