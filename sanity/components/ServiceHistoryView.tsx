'use client'

import React, {useEffect, useState, useCallback} from 'react'
import {useClient} from 'sanity'
import {Box, Card, Flex, Stack, Text, Badge, Spinner} from '@sanity/ui'

interface HistoryItem {
  _id: string
  _type: string
  type?: string
  title?: string
  status?: string
  date?: string
  description?: string
  priority?: string
  _createdAt?: string
}

const TYPE_LABELS: Record<string, string> = {
  repair: 'Reparatur',
  maintenance: 'Wartung',
  inspection: 'Inspektion',
  emergency: 'Notfall',
  note: 'Notiz',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
  pending_approval: 'Warte auf Freigabe',
  approved: 'Freigegeben',
  rejected: 'Abgelehnt',
  in_progress_ticket: 'In Bearbeitung',
  completed: 'Abgeschlossen',
}

const STATUS_TONES: Record<string, 'caution' | 'positive' | 'critical' | 'primary' | 'default'> = {
  open: 'caution',
  in_progress: 'primary',
  done: 'positive',
  pending_approval: 'caution',
  approved: 'positive',
  rejected: 'critical',
  in_progress_ticket: 'primary',
  completed: 'positive',
}

/**
 * Custom view component that displays related Logbook Entries and Tickets
 * for the currently viewed document (matched via target._ref / scope._ref).
 */
export function ServiceHistoryView(props: any) {
  const {document} = props
  const documentId: string | undefined = document?.displayed?._id
  const client = useClient({apiVersion: '2024-01-01'})
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(() => {
    if (!documentId) {
      setLoading(false)
      return
    }

    // Strip "drafts." prefix so references match published IDs
    const cleanId = documentId.replace(/^drafts\./, '')

    const query = `*[
      (_type == "logbookEntry" && target._ref == $id) ||
      (_type == "ticket" && scope._ref == $id)
    ] | order(_createdAt desc) {
      _id,
      _type,
      type,
      title,
      status,
      priority,
      date,
      description,
      _createdAt
    }[0...50]`

    setLoading(true)
    client
      .fetch(query, {id: cleanId})
      .then((results: HistoryItem[]) => {
        setItems(results || [])
        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setLoading(false)
      })
  }, [documentId, client])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  if (loading) {
    return (
      <Box padding={5}>
        <Flex align="center" justify="center" padding={5}>
          <Spinner muted />
        </Flex>
      </Box>
    )
  }

  if (!items.length) {
    return (
      <Box padding={4}>
        <Card padding={4} radius={2} tone="transparent">
          <Text align="center" muted>
            Keine Service-Historie vorhanden.
          </Text>
        </Card>
      </Box>
    )
  }

  return (
    <Box padding={4}>
      <Stack space={3}>
        {items.map((item) => {
          const isTicket = item._type === 'ticket'
          const label = isTicket
            ? item.title
            : TYPE_LABELS[item.type || ''] || item.type || 'Eintrag'

          const dateStr = (item.date || item._createdAt)
            ? new Date(item.date || item._createdAt || '').toLocaleDateString('de-CH')
            : ''

          const statusKey = item.status || ''
          const statusLabel = STATUS_LABELS[statusKey] || statusKey
          const statusTone = STATUS_TONES[statusKey] || 'default'

          return (
            <Card key={item._id} padding={3} radius={2} border>
              <Flex align="center" justify="space-between">
                <Stack space={2}>
                  <Flex align="center" gap={2}>
                    <Badge tone={isTicket ? 'primary' : 'default'}>
                      {isTicket ? 'Ticket' : 'Logbuch'}
                    </Badge>
                    <Text weight="semibold" size={1}>
                      {label || 'Ohne Titel'}
                    </Text>
                  </Flex>
                  {(dateStr || item.description) && (
                    <Text muted size={1}>
                      {[dateStr, item.description?.slice(0, 100)]
                        .filter(Boolean)
                        .join(' — ')}
                    </Text>
                  )}
                </Stack>
                {statusKey && (
                  <Badge tone={statusTone}>{statusLabel}</Badge>
                )}
              </Flex>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
