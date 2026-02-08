'use client'

import React, {useEffect, useState, useCallback, useMemo} from 'react'
import {useClient} from 'sanity'
import {
  Box,
  Card,
  Flex,
  Stack,
  Text,
  Badge,
  Spinner,
  Heading,
  TextInput,
  Select,
  Button,
} from '@sanity/ui'
import {
  SearchIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  RotateCcwIcon,
  PrinterIcon,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────
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
  sourceName?: string
  sourceType?: string
}

type StatusFilter = 'all' | 'active' | 'done'
type TypeFilter = 'all' | 'ticket' | 'logbookEntry'
type SortOrder = 'desc' | 'asc'

// ── Status Groupings ─────────────────────────────────────
// Comprehensive sets covering all possible status values
// (German labels, English labels, edge cases)
const ACTIVE_STATUSES = new Set([
  'open',
  'in_progress',
  'pending_approval',
  'approved',
  'wartend',
  'new',
  'analyzing',
  'assigned',
])
const DONE_STATUSES = new Set([
  'done',
  'completed',
  'resolved',
  'closed',
  'rejected',
  'cancelled',
  'canceled',
])

// ── Label Maps ───────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  repair: 'Reparatur',
  maintenance: 'Wartung',
  inspection: 'Inspektion',
  emergency: 'Notfall',
  note: 'Notiz',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  new: 'Neu',
  analyzing: 'Analyse',
  assigned: 'Zugewiesen',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
  pending_approval: 'Wartend',
  wartend: 'Wartend',
  approved: 'Freigegeben',
  rejected: 'Abgelehnt',
  completed: 'Abgeschlossen',
  resolved: 'Geloest',
  closed: 'Geschlossen',
  cancelled: 'Storniert',
  canceled: 'Storniert',
}

const STATUS_TONES: Record<
  string,
  'caution' | 'positive' | 'critical' | 'primary' | 'default'
> = {
  open: 'caution',
  new: 'caution',
  analyzing: 'caution',
  assigned: 'primary',
  in_progress: 'primary',
  done: 'positive',
  pending_approval: 'caution',
  wartend: 'caution',
  approved: 'positive',
  rejected: 'critical',
  completed: 'positive',
  resolved: 'positive',
  closed: 'positive',
  cancelled: 'critical',
  canceled: 'critical',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  emergency: 'NOTFALL',
}

const PRIORITY_TONES: Record<
  string,
  'default' | 'caution' | 'critical' | 'positive' | 'primary'
> = {
  low: 'default',
  medium: 'caution',
  high: 'critical',
  emergency: 'critical',
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  property: 'Liegenschaft',
  building: 'Gebaeude',
  floor: 'Stockwerk',
  unit: 'Einheit',
  asset: 'Asset',
  parkingFacility: 'Parkanlage',
  parkingSpot: 'Parkplatz',
  outdoorArea: 'Aussenanlage',
}

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Alle',
  active: 'Offen / In Arbeit',
  done: 'Erledigt / Abgeschlossen',
}

const TYPE_FILTER_LABELS: Record<TypeFilter, string> = {
  all: 'Alle',
  ticket: 'Nur Tickets',
  logbookEntry: 'Nur Logbuch',
}

// ── Print Styles ─────────────────────────────────────────
// "Nuclear overlay" technique:
//   1. body * { visibility: hidden }  → kills every child
//   2. .srv-print-container           → position: fixed, 100vw x 100vh,
//      max z-index, white bg = opaque overlay masking the app
//   3. .srv-print-container *         → visibility: visible (re-enable children)
//   4. Typography: black #000, Arial/Helvetica, 12px base
const PRINT_STYLES = `
/* ── Screen: the print container does not exist ──────── */
.srv-print-container {
  display: none;
}

@media print {
  /* ── 1. A4 PORTRAIT page ───────────────────────────── */
  @page {
    size: A4 portrait;
    margin: 20mm;
  }

  /* ── 2. NUCLEAR: hide every element on the page ────── */
  body * {
    visibility: hidden !important;
  }

  /* ── 3. THE OVERLAY: fixed full-viewport white mask ── */
  .srv-print-container {
    display: block !important;
    visibility: visible !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: auto !important;
    min-height: 100vh !important;
    z-index: 2147483647 !important;
    background-color: white !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
  }

  /* ── 4. Re-enable everything INSIDE the container ──── */
  .srv-print-container * {
    visibility: visible !important;
  }

  /* ── 5. Enforce clean typography globally inside ───── */
  .srv-print-container,
  .srv-print-container * {
    color: #000 !important;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
    box-shadow: none !important;
    text-shadow: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* White bg only on the container itself; table cells
     can override for alternating rows below */
  .srv-print-container {
    background-color: white !important;
  }

  /* ── 6. Screen-only elements: kill with display ────── */
  .srv-no-print {
    display: none !important;
  }

  /* ── 7. Report header ──────────────────────────────── */
  .srv-rpt-logo {
    font-size: 20pt !important;
    font-weight: 800 !important;
    letter-spacing: -0.02em !important;
    line-height: 1.1 !important;
  }
  .srv-rpt-logo-sep {
    font-weight: 400 !important;
    margin: 0 4px !important;
  }
  .srv-rpt-subtitle {
    font-size: 7pt !important;
    color: #666 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    margin-top: 2px !important;
  }
  .srv-rpt-meta {
    font-size: 8pt !important;
    color: #555 !important;
  }
  .srv-rpt-title {
    font-size: 14pt !important;
    font-weight: 700 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .srv-rpt-scope {
    font-size: 8pt !important;
    color: #444 !important;
    margin-top: 2px !important;
  }
  .srv-rpt-filter {
    font-size: 7pt !important;
    color: #888 !important;
    margin-top: 8px !important;
    margin-bottom: 12px !important;
  }
  .srv-rpt-rule {
    border-bottom: 2px solid #000 !important;
    padding-bottom: 6px !important;
    margin-bottom: 4px !important;
  }

  /* ── 8. Data table (full-width, 12px base) ─────────── */
  .srv-print-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 12px !important;
    page-break-inside: auto !important;
    table-layout: auto !important;
  }
  .srv-print-table th {
    background-color: #f0f0f0 !important;
    font-weight: 700 !important;
    text-align: left !important;
    padding: 6px 8px !important;
    border-bottom: 2px solid #999 !important;
    font-size: 10px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
    white-space: nowrap !important;
  }
  .srv-print-table td {
    padding: 5px 8px !important;
    border-bottom: 1px solid #ddd !important;
    vertical-align: top !important;
    line-height: 1.4 !important;
    background-color: transparent !important;
  }
  .srv-print-table tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .srv-print-table tbody tr:nth-child(even) td {
    background-color: #f8f8f8 !important;
  }
  .srv-print-table thead {
    display: table-header-group !important;
  }

  /* ── Nowrap for compact columns ─────────────────────── */
  .srv-cell-nr,
  .srv-cell-date,
  .srv-cell-prio,
  .srv-cell-status {
    white-space: nowrap !important;
  }

  /* ── Group header row ─────────────────────────────── */
  .srv-group-header td {
    background-color: #e0e0e0 !important;
    font-weight: 700 !important;
    font-size: 11px !important;
    padding: 7px 8px !important;
    border-bottom: 2px solid #999 !important;
    border-top: 1px solid #999 !important;
    letter-spacing: 0.02em !important;
    page-break-after: avoid !important;
  }

  .srv-prio-emergency td {
    font-weight: 700 !important;
  }
  .srv-prio-high td {
    font-weight: 600 !important;
  }
  .srv-cell-desc {
    font-size: 10px !important;
    color: #444 !important;
    margin-top: 2px !important;
  }
  .srv-cell-nr {
    text-align: center !important;
    color: #888 !important;
  }
  .srv-cell-src-type {
    font-size: 10px !important;
    color: #666 !important;
  }

  /* ── 9. Footer on every printed page ───────────────── */
  .srv-print-footer {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    text-align: center !important;
    font-size: 7pt !important;
    color: #aaa !important;
    border-top: 0.5pt solid #ccc !important;
    padding: 3px 0 0 0 !important;
    background-color: white !important;
  }
}
`

// ── Descendant ID Collection Queries ─────────────────────
function getDescendantQuery(docType: string): string | null {
  switch (docType) {
    case 'property':
      return `{
        "buildings": *[_type == "building" && property._ref == $id]._id,
        "parking":   *[_type == "parkingFacility" && property._ref == $id]._id,
        "outdoor":   *[_type == "outdoorArea" && property._ref == $id]._id,
        "floors":    *[_type == "floor" && building._ref in
                        *[_type == "building" && property._ref == $id]._id
                      ]._id,
        "units":     *[_type == "unit" && building._ref in
                        *[_type == "building" && property._ref == $id]._id
                      ]._id,
        "spots":     *[_type == "parkingSpot" && facility._ref in
                        *[_type == "parkingFacility" && property._ref == $id]._id
                      ]._id,
        "assets":    *[_type == "asset" && location._ref in (
                        *[_type == "building" && property._ref == $id]._id
                      + *[_type == "floor" && building._ref in
                            *[_type == "building" && property._ref == $id]._id
                          ]._id
                      + *[_type == "unit" && building._ref in
                            *[_type == "building" && property._ref == $id]._id
                          ]._id
                      + *[_type == "parkingFacility" && property._ref == $id]._id
                      + *[_type == "parkingSpot" && facility._ref in
                            *[_type == "parkingFacility" && property._ref == $id]._id
                          ]._id
                      + *[_type == "outdoorArea" && property._ref == $id]._id
                      )]._id
      }`
    case 'building':
      return `{
        "floors": *[_type == "floor" && building._ref == $id]._id,
        "units":  *[_type == "unit" && building._ref == $id]._id,
        "assets": *[_type == "asset" && location._ref in (
                      [$id]
                    + *[_type == "floor" && building._ref == $id]._id
                    + *[_type == "unit" && building._ref == $id]._id
                    )]._id
      }`
    case 'floor':
      return `{
        "units":  *[_type == "unit" && floor._ref == $id]._id,
        "assets": *[_type == "asset" && location._ref in (
                      [$id]
                    + *[_type == "unit" && floor._ref == $id]._id
                    )]._id
      }`
    case 'unit':
      return `{
        "assets": *[_type == "asset" && location._ref == $id]._id
      }`
    case 'parkingFacility':
      return `{
        "spots":  *[_type == "parkingSpot" && facility._ref == $id]._id,
        "assets": *[_type == "asset" && location._ref in (
                      [$id]
                    + *[_type == "parkingSpot" && facility._ref == $id]._id
                    )]._id
      }`
    case 'outdoorArea':
      return `{
        "assets": *[_type == "asset" && location._ref == $id]._id
      }`
    default:
      return null
  }
}

function flattenIds(
  result: Record<string, string[]> | null,
  rootId: string
): string[] {
  const set = new Set<string>([rootId])
  if (result) {
    for (const arr of Object.values(result)) {
      if (Array.isArray(arr)) {
        for (const id of arr) {
          if (!id.startsWith('drafts.')) set.add(id)
        }
      }
    }
  }
  return Array.from(set)
}

// ── Event Query ──────────────────────────────────────────
const EVENT_QUERY = `*[
  !(_id in path("drafts.**")) && (
    (_type == "ticket"       && scope._ref  in $ids) ||
    (_type == "logbookEntry" && target._ref in $ids)
  )
] | order(coalesce(date, _createdAt) desc) {
  _id,
  _type,
  type,
  title,
  status,
  priority,
  date,
  description,
  _createdAt,
  "sourceName": select(
    _type == "ticket"       => coalesce(scope->name, scope->title, scope->number),
    _type == "logbookEntry" => coalesce(target->name, target->title, target->number)
  ),
  "sourceType": select(
    _type == "ticket"       => scope->_type,
    _type == "logbookEntry" => target->_type
  )
}[0...100]`

// ── Helpers ──────────────────────────────────────────────
function getItemDate(item: HistoryItem): number {
  const raw = item.date || item._createdAt || ''
  return raw ? new Date(raw).getTime() : 0
}

function getSearchableText(item: HistoryItem): string {
  const parts = [
    item.title,
    item.description,
    item.sourceName,
    item._type === 'ticket' ? 'ticket' : TYPE_LABELS[item.type || ''],
  ]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function formatDate(item: HistoryItem): string {
  const raw = item.date || item._createdAt || ''
  return raw ? new Date(raw).toLocaleDateString('de-CH') : ''
}

// ── Component ────────────────────────────────────────────
export function ServiceHistoryView(props: any) {
  const {document} = props
  const doc = document?.displayed
  const documentId: string | undefined = doc?._id
  const documentType: string | undefined = doc?._type
  const documentName: string =
    doc?.name || doc?.title || doc?.slug?.current || 'Unbekannt'

  const client = useClient({apiVersion: '2024-01-01'})
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState('')

  // ── Filter / Sort State ────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // ── Data Fetching (unchanged) ──────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!documentId || !documentType) {
      setLoading(false)
      return
    }

    setLoading(true)
    const cleanId = documentId.replace(/^drafts\./, '')

    try {
      const descendantQuery = getDescendantQuery(documentType)
      let allIds: string[]

      if (descendantQuery) {
        const result: Record<string, string[]> = await client.fetch(
          descendantQuery,
          {id: cleanId}
        )
        allIds = flattenIds(result, cleanId)
      } else {
        allIds = [cleanId]
      }

      const childCount = allIds.length - 1
      if (childCount > 0) {
        setScope(
          `${SOURCE_TYPE_LABELS[documentType] || documentType} + ${childCount} Unterobjekt${childCount !== 1 ? 'e' : ''}`
        )
      } else {
        setScope(SOURCE_TYPE_LABELS[documentType] || documentType)
      }

      const results: HistoryItem[] = await client.fetch(EVENT_QUERY, {
        ids: allIds,
      })
      setItems(results || [])
    } catch (err) {
      console.error('ServiceHistoryView: fetch error', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [documentId, documentType, client])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // ── Client-Side Filtering + Sorting ────────────────────
  const filteredItems = useMemo(() => {
    let result = [...items]

    // 1. Text search (case-insensitive across title, description, sourceName, type label)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((item) => getSearchableText(item).includes(q))
    }

    // 2. Status filter (normalize to lowercase to catch any casing mismatch)
    if (statusFilter === 'active') {
      result = result.filter((item) =>
        ACTIVE_STATUSES.has((item.status || '').toLowerCase())
      )
    } else if (statusFilter === 'done') {
      result = result.filter((item) =>
        DONE_STATUSES.has((item.status || '').toLowerCase())
      )
    }

    // 3. Type filter (strict _type match)
    if (typeFilter === 'ticket') {
      result = result.filter((item) => item._type === 'ticket')
    } else if (typeFilter === 'logbookEntry') {
      result = result.filter((item) => item._type === 'logbookEntry')
    }

    // 4. Sort by date
    result.sort((a, b) => {
      const da = getItemDate(a)
      const db = getItemDate(b)
      return sortOrder === 'desc' ? db - da : da - db
    })

    return result
  }, [items, searchQuery, statusFilter, typeFilter, sortOrder])

  // ── Derived stats ──────────────────────────────────────
  const ticketCount = filteredItems.filter((i) => i._type === 'ticket').length
  const logbookCount = filteredItems.filter(
    (i) => i._type === 'logbookEntry'
  ).length

  // ── Grouped items for Print view ──────────────────────
  // Groups by sourceName, sorted alphabetically. Items
  // within each group keep their existing sort order.
  const groupedForPrint = useMemo(() => {
    const groups = new Map<string, HistoryItem[]>()
    for (const item of filteredItems) {
      const key =
        item.sourceName ||
        SOURCE_TYPE_LABELS[item.sourceType || ''] ||
        'Ohne Zuordnung'
      const arr = groups.get(key)
      if (arr) {
        arr.push(item)
      } else {
        groups.set(key, [item])
      }
    }
    // Sort groups alphabetically by key
    return Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], 'de')
    )
  }, [filteredItems])
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all'

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
    setSortOrder('desc')
  }

  // ── Print with dynamic filename ───────────────────────
  const handlePrint = useCallback(() => {
    const sanitized = documentName
      .replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_') // Replace non-alphanumeric (keep accents)
      .replace(/_+/g, '_')                          // Collapse multiple underscores
      .replace(/^_|_$/g, '')                        // Trim leading/trailing
    const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const pdfTitle = `Service-Report_${sanitized}_${dateStr}`

    const originalTitle = document.title
    document.title = pdfTitle
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 500)
  }, [documentName])

  // ── Print context string ───────────────────────────────
  const printFilterContext = useMemo(() => {
    const parts: string[] = []
    parts.push(`Status: ${STATUS_FILTER_LABELS[statusFilter]}`)
    parts.push(`Typ: ${TYPE_FILTER_LABELS[typeFilter]}`)
    if (searchQuery.trim()) {
      parts.push(`Suche: "${searchQuery.trim()}"`)
    }
    parts.push(
      `Sortierung: ${sortOrder === 'desc' ? 'Neueste zuerst' : 'Aelteste zuerst'}`
    )
    return parts.join('  |  ')
  }, [statusFilter, typeFilter, searchQuery, sortOrder])

  const printTimestamp = useMemo(
    () =>
      new Date().toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredItems]
  )

  // ── Render: Loading ────────────────────────────────────
  if (loading) {
    return (
      <Box padding={5}>
        <Flex align="center" justify="center" padding={5}>
          <Spinner muted />
        </Flex>
      </Box>
    )
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      {/* Inject print stylesheet (lives outside the Box so it's always present) */}
      <style>{PRINT_STYLES}</style>

      {/* ════════════════════════════════════════════════════
          PRINT-ONLY CONTAINER
          Hidden on screen (display:none via CSS).
          On @media print: absolute-positioned, visible, z-99999.
          Contains the ENTIRE PDF document.
         ════════════════════════════════════════════════════ */}
      <div className="srv-print-container">
        {/* ── Report Header ─────────────────────────────── */}
        <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: 16}}>
          <tbody>
            <tr>
              <td style={{verticalAlign: 'top', paddingBottom: 10}}>
                <div className="srv-rpt-logo">
                  <span>RUTA</span>
                  <span className="srv-rpt-logo-sep">//</span>
                  <span>TECH</span>
                </div>
                <div className="srv-rpt-subtitle">Facility Management Platform</div>
              </td>
              <td style={{verticalAlign: 'top', textAlign: 'right', paddingBottom: 10}}>
                <div className="srv-rpt-meta">Erstellt: {printTimestamp}</div>
                <div className="srv-rpt-meta" style={{marginTop: 2}}>
                  {filteredItems.length} Eintraege ({ticketCount} Tickets, {logbookCount} Logbuch)
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="srv-rpt-rule">
          <div className="srv-rpt-title">Service-Report: {documentName}</div>
          <div className="srv-rpt-scope">
            {SOURCE_TYPE_LABELS[documentType || ''] || documentType || ''}: {documentName}
            {scope && ` \u2014 Suchbereich: ${scope}`}
          </div>
        </div>

        <div className="srv-rpt-filter">Filter: {printFilterContext}</div>

        {/* ── Data Table (Grouped by Source) ────────────── */}
        {filteredItems.length > 0 && (
          <table className="srv-print-table">
            <thead>
              <tr>
                <th style={{width: '5%'}}>Nr.</th>
                <th style={{width: '10%'}}>Typ</th>
                <th>Titel / Beschreibung</th>
                <th style={{width: '12%'}}>Datum</th>
                <th style={{width: '10%'}}>Prioritaet</th>
                <th style={{width: '12%'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let globalIdx = 0
                return groupedForPrint.map(([sourceName, groupItems]) => (
                  <React.Fragment key={sourceName}>
                    {/* ── Group Header Row ──────────────── */}
                    <tr className="srv-group-header">
                      <td colSpan={6}>
                        Quelle: {sourceName} ({groupItems.length}{' '}
                        {groupItems.length === 1 ? 'Eintrag' : 'Eintraege'})
                      </td>
                    </tr>
                    {/* ── Group Data Rows ───────────────── */}
                    {groupItems.map((item) => {
                      globalIdx++
                      const isTicket = item._type === 'ticket'
                      const label = isTicket
                        ? item.title
                        : TYPE_LABELS[item.type || ''] ||
                          item.type ||
                          'Eintrag'
                      const statusLabel =
                        STATUS_LABELS[item.status || ''] || item.status || ''
                      const prioLabel =
                        PRIORITY_LABELS[item.priority || ''] || '\u2014'
                      const prioClass = item.priority
                        ? `srv-prio-${item.priority}`
                        : ''

                      return (
                        <tr key={item._id} className={prioClass}>
                          <td className="srv-cell-nr">{globalIdx}</td>
                          <td>{isTicket ? 'Ticket' : 'Logbuch'}</td>
                          <td>
                            <strong>{label || 'Ohne Titel'}</strong>
                            {item.description && (
                              <div className="srv-cell-desc">
                                {item.description.length > 140
                                  ? item.description.slice(0, 140) + '...'
                                  : item.description}
                              </div>
                            )}
                          </td>
                          <td className="srv-cell-date">{formatDate(item)}</td>
                          <td className="srv-cell-prio">{isTicket ? prioLabel : '\u2014'}</td>
                          <td className="srv-cell-status">{statusLabel}</td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))
              })()}
            </tbody>
          </table>
        )}

        {filteredItems.length === 0 && (
          <p style={{textAlign: 'center', marginTop: 40}}>
            Keine Eintraege vorhanden.
          </p>
        )}

        {/* ── Print Footer (fixed to bottom of every page) ─ */}
        <div className="srv-print-footer">
          RUTA // TECH &mdash; Service-Report &mdash; {documentName} &mdash; {printTimestamp}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SCREEN-ONLY UI
          Normal Sanity Studio view. Completely hidden on print
          via .srv-no-print { display: none }.
         ════════════════════════════════════════════════════ */}
      <Box padding={4} className="srv-no-print">
        <Stack space={4}>
          {/* ── Screen Header ───────────────────────────── */}
          <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
            <Heading as="h3" size={1}>
              Service-Historie
            </Heading>
            <Flex gap={2} align="center">
              <Badge tone="primary">{ticketCount} Tickets</Badge>
              <Badge>{logbookCount} Logbuch</Badge>
              {hasActiveFilters && (
                <Text size={0} muted>
                  (gefiltert aus {items.length})
                </Text>
              )}
            </Flex>
          </Flex>

          {scope && (
            <Text size={1} muted>
              Suchbereich: {scope}
            </Text>
          )}

          {/* ── Filter Toolbar ──────────────────────────── */}
          <Card padding={3} radius={2} tone="transparent" border>
            <Flex gap={3} wrap="wrap" align="flex-end">
              {/* Search */}
              <Box style={{flex: '2 1 200px'}}>
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>
                    Suche
                  </Text>
                  <TextInput
                    icon={SearchIcon}
                    placeholder="Titel, Beschreibung, Quelle..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchQuery(e.currentTarget.value)
                    }
                    fontSize={1}
                  />
                </Stack>
              </Box>

              {/* Status Filter */}
              <Box style={{flex: '1 1 140px'}}>
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>
                    Status
                  </Text>
                  <Select
                    fontSize={1}
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setStatusFilter(e.currentTarget.value as StatusFilter)
                    }
                  >
                    <option value="all">Alle</option>
                    <option value="active">Offen / In Arbeit</option>
                    <option value="done">Erledigt / Abgeschlossen</option>
                  </Select>
                </Stack>
              </Box>

              {/* Type Filter */}
              <Box style={{flex: '1 1 120px'}}>
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>
                    Typ
                  </Text>
                  <Select
                    fontSize={1}
                    value={typeFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setTypeFilter(e.currentTarget.value as TypeFilter)
                    }
                  >
                    <option value="all">Alle</option>
                    <option value="ticket">Nur Tickets</option>
                    <option value="logbookEntry">Nur Logbuch</option>
                  </Select>
                </Stack>
              </Box>

              {/* Sort + Reset + Print */}
              <Flex gap={2} align="flex-end" style={{flex: '0 0 auto'}}>
                <Button
                  icon={sortOrder === 'desc' ? ArrowDownIcon : ArrowUpIcon}
                  text={
                    sortOrder === 'desc'
                      ? 'Neueste zuerst'
                      : 'Aelteste zuerst'
                  }
                  mode="ghost"
                  fontSize={1}
                  onClick={() =>
                    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                  }
                />
                {hasActiveFilters && (
                  <Button
                    icon={RotateCcwIcon}
                    text="Reset"
                    mode="ghost"
                    tone="critical"
                    fontSize={1}
                    onClick={resetFilters}
                  />
                )}
                <Button
                  icon={PrinterIcon}
                  text="Drucken / PDF"
                  tone="primary"
                  fontSize={1}
                  onClick={handlePrint}
                  disabled={filteredItems.length === 0}
                />
              </Flex>
            </Flex>
          </Card>

          {/* ── Empty State ─────────────────────────────── */}
          {filteredItems.length === 0 && (
            <Card padding={4} radius={2} tone="transparent">
              <Text align="center" muted>
                {items.length === 0
                  ? 'Keine Service-Historie vorhanden.'
                  : 'Keine Eintraege fuer diesen Filter.'}
              </Text>
            </Card>
          )}

          {/* ── Screen Table (Card rows) ────────────────── */}
          {filteredItems.length > 0 && (
            <>
              <Card padding={2} radius={2} tone="transparent">
                <Flex align="center" gap={2}>
                  <Box flex={1} style={{minWidth: 60}}>
                    <Text size={0} weight="semibold" muted>
                      Typ
                    </Text>
                  </Box>
                  <Box flex={3}>
                    <Text size={0} weight="semibold" muted>
                      Titel
                    </Text>
                  </Box>
                  <Box flex={2}>
                    <Text size={0} weight="semibold" muted>
                      Quelle
                    </Text>
                  </Box>
                  <Box flex={1}>
                    <Text size={0} weight="semibold" muted>
                      Datum
                    </Text>
                  </Box>
                  <Box flex={1} style={{textAlign: 'right'}}>
                    <Text size={0} weight="semibold" muted>
                      Status
                    </Text>
                  </Box>
                </Flex>
              </Card>
              <Stack space={2}>
                {filteredItems.map((item) => (
                  <HistoryRow key={item._id} item={item} />
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </Box>
    </>
  )
}

// ── Row Component (screen only) ──────────────────────────
function HistoryRow({item}: {item: HistoryItem}) {
  const isTicket = item._type === 'ticket'
  const label = isTicket
    ? item.title
    : TYPE_LABELS[item.type || ''] || item.type || 'Eintrag'

  const dateStr = formatDate(item)

  const statusKey = item.status || ''
  const statusLabel = STATUS_LABELS[statusKey] || statusKey
  const statusTone = STATUS_TONES[statusKey] || 'default'

  const srcLabel =
    item.sourceName || SOURCE_TYPE_LABELS[item.sourceType || ''] || ''
  const srcTypeLabel = SOURCE_TYPE_LABELS[item.sourceType || ''] || ''

  const prioKey = item.priority || ''
  const prioLabel = PRIORITY_LABELS[prioKey] || ''
  const prioTone = PRIORITY_TONES[prioKey] || 'default'

  return (
    <Card padding={3} radius={2} border>
      <Flex align="center" gap={2}>
        <Box flex={1} style={{minWidth: 60}}>
          <Stack space={2}>
            <Badge tone={isTicket ? 'primary' : 'default'} fontSize={0}>
              {isTicket ? 'Ticket' : 'Logbuch'}
            </Badge>
            {isTicket && prioLabel && (
              <Badge tone={prioTone} fontSize={0}>
                {prioLabel}
              </Badge>
            )}
          </Stack>
        </Box>
        <Box flex={3}>
          <Stack space={1}>
            <Text weight="semibold" size={1}>
              {label || 'Ohne Titel'}
            </Text>
            {item.description && (
              <Text muted size={0}>
                {item.description.length > 80
                  ? item.description.slice(0, 80) + '...'
                  : item.description}
              </Text>
            )}
          </Stack>
        </Box>
        <Box flex={2}>
          <Stack space={1}>
            <Text size={1}>{srcLabel || '\u2014'}</Text>
            {srcTypeLabel && srcLabel !== srcTypeLabel && (
              <Text muted size={0}>
                {srcTypeLabel}
              </Text>
            )}
          </Stack>
        </Box>
        <Box flex={1}>
          <Text size={1} muted>
            {dateStr}
          </Text>
        </Box>
        <Box flex={1} style={{textAlign: 'right'}}>
          <Badge tone={statusTone}>{statusLabel}</Badge>
        </Box>
      </Flex>
    </Card>
  )
}
