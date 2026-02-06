'use client'

import React, { useCallback, useRef, useState } from 'react'
import Papa from 'papaparse'
import { Box, Button, Card, Code, Flex, Heading, Stack, Text } from '@sanity/ui'
import { useClient } from 'sanity'

// ── Types ────────────────────────────────────────────────

interface CsvRow {
  Property?: string
  Building?: string
  Floor?: string
  Unit?: string
  Asset?: string
  AssetType?: string
}

interface LogEntry {
  row: number
  level: string
  action: 'created' | 'exists' | 'error'
  name: string
  detail?: string
}

type ImportPhase = 'idle' | 'parsing' | 'importing' | 'done' | 'error'

// ── Helpers ──────────────────────────────────────────────

function stripDraftPrefix(id: string): string {
  return id.replace(/^drafts\./, '')
}

/** Generate a deterministic slug from a name */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ── Cache for upsert operations ──────────────────────────

type UpsertCache = Map<string, string> // cacheKey → documentId

// ── Component ────────────────────────────────────────────

export function MassImport(props: { document: { displayed: { _id: string } } }) {
  const tenantId = stripDraftPrefix(props.document.displayed._id)
  const client = useClient({ apiVersion: '2024-01-01' })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<ImportPhase>('idle')
  const [rows, setRows] = useState<CsvRow[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const addLog = useCallback((entry: LogEntry) => {
    setLog((prev) => [...prev, entry])
  }, [])

  // ── Upsert: find or create a document ──────────────────

  const upsert = useCallback(
    async (
      cache: UpsertCache,
      type: string,
      name: string,
      parentFilter: string,
      parentParams: Record<string, string>,
      extraFields: Record<string, unknown>,
      rowIndex: number,
      level: string
    ): Promise<string | null> => {
      const cacheKey = `${type}:${name}:${JSON.stringify(parentParams)}`
      if (cache.has(cacheKey)) {
        addLog({ row: rowIndex, level, action: 'exists', name })
        return cache.get(cacheKey)!
      }

      try {
        // Try to find existing
        const query = `*[_type == "${type}" && name == $name && tenant._ref == $tenantId ${parentFilter}][0]._id`
        const existingId = await client.fetch<string | null>(query, {
          name,
          tenantId,
          ...parentParams,
        })

        if (existingId) {
          const cleanId = stripDraftPrefix(existingId)
          cache.set(cacheKey, cleanId)
          addLog({ row: rowIndex, level, action: 'exists', name })
          return cleanId
        }

        // Create new document
        const doc = await client.create({
          _type: type,
          name,
          tenant: { _type: 'reference', _ref: tenantId },
          ...extraFields,
        })

        cache.set(cacheKey, doc._id)
        addLog({ row: rowIndex, level, action: 'created', name })
        return doc._id
      } catch (err) {
        addLog({
          row: rowIndex,
          level,
          action: 'error',
          name,
          detail: err instanceof Error ? err.message : 'Unknown error',
        })
        return null
      }
    },
    [client, tenantId, addLog]
  )

  // ── Process all rows ───────────────────────────────────

  const processRows = useCallback(
    async (data: CsvRow[]) => {
      setPhase('importing')
      setLog([])
      setProgress({ current: 0, total: data.length })

      const cache: UpsertCache = new Map()

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        setProgress({ current: i + 1, total: data.length })

        // Skip empty rows
        if (!row.Property?.trim() && !row.Building?.trim()) continue

        // Level 1: Property
        let propertyId: string | null = null
        if (row.Property?.trim()) {
          propertyId = await upsert(
            cache,
            'property',
            row.Property.trim(),
            '',
            {},
            { slug: { _type: 'slug', current: toSlug(row.Property.trim()) } },
            i + 1,
            'Property'
          )
        }

        // Level 2: Building
        let buildingId: string | null = null
        if (row.Building?.trim() && propertyId) {
          buildingId = await upsert(
            cache,
            'building',
            row.Building.trim(),
            '&& property._ref == $propertyId',
            { propertyId },
            {
              slug: { _type: 'slug', current: toSlug(row.Building.trim()) },
              property: { _type: 'reference', _ref: propertyId },
            },
            i + 1,
            'Building'
          )
        }

        // Level 3: Floor
        let floorId: string | null = null
        if (row.Floor?.trim() && buildingId) {
          // For floors, match on `title` instead of `name`
          const floorName = row.Floor.trim()
          const floorCacheKey = `floor:${floorName}:${buildingId}`
          if (cache.has(floorCacheKey)) {
            addLog({ row: i + 1, level: 'Floor', action: 'exists', name: floorName })
            floorId = cache.get(floorCacheKey)!
          } else {
            try {
              const existingFloor = await client.fetch<string | null>(
                `*[_type == "floor" && title == $title && building._ref == $buildingId && tenant._ref == $tenantId][0]._id`,
                { title: floorName, buildingId, tenantId }
              )
              if (existingFloor) {
                floorId = stripDraftPrefix(existingFloor)
                cache.set(floorCacheKey, floorId)
                addLog({ row: i + 1, level: 'Floor', action: 'exists', name: floorName })
              } else {
                const doc = await client.create({
                  _type: 'floor',
                  title: floorName,
                  tenant: { _type: 'reference', _ref: tenantId },
                  building: { _type: 'reference', _ref: buildingId },
                  slug: { _type: 'slug', current: toSlug(floorName) },
                })
                floorId = doc._id
                cache.set(floorCacheKey, floorId)
                addLog({ row: i + 1, level: 'Floor', action: 'created', name: floorName })
              }
            } catch (err) {
              addLog({
                row: i + 1,
                level: 'Floor',
                action: 'error',
                name: floorName,
                detail: err instanceof Error ? err.message : 'Unknown error',
              })
            }
          }
        }

        // Level 4: Unit
        let unitId: string | null = null
        if (row.Unit?.trim() && buildingId) {
          unitId = await upsert(
            cache,
            'unit',
            row.Unit.trim(),
            '&& building._ref == $buildingId' + (floorId ? ' && floor._ref == $floorId' : ''),
            { buildingId, ...(floorId ? { floorId } : {}) },
            {
              slug: { _type: 'slug', current: toSlug(row.Unit.trim()) },
              building: { _type: 'reference', _ref: buildingId },
              ...(floorId ? { floor: { _type: 'reference', _ref: floorId } } : {}),
            },
            i + 1,
            'Unit'
          )
        }

        // Level 5: Asset (optional)
        if (row.Asset?.trim()) {
          // Determine the most specific location
          const locationRef = unitId || floorId || buildingId || propertyId
          if (locationRef) {
            await upsert(
              cache,
              'asset',
              row.Asset.trim(),
              '&& location._ref == $locationRef',
              { locationRef },
              {
                qrCodeId: { _type: 'slug', current: toSlug(row.Asset.trim()) },
                location: { _type: 'reference', _ref: locationRef },
                status: 'active',
              },
              i + 1,
              'Asset'
            )
          }
        }
      }

      setPhase('done')
    },
    [client, tenantId, upsert, addLog]
  )

  // ── File handler ───────────────────────────────────────

  const handleFile = useCallback(
    (file: File) => {
      setPhase('parsing')
      setLog([])

      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.errors.length > 0) {
            setPhase('error')
            addLog({
              row: 0,
              level: 'Parser',
              action: 'error',
              name: 'CSV',
              detail: results.errors.map((e) => e.message).join('; '),
            })
            return
          }

          const data = results.data.filter(
            (r) => r.Property?.trim() || r.Building?.trim()
          )

          if (data.length === 0) {
            setPhase('error')
            addLog({
              row: 0,
              level: 'Parser',
              action: 'error',
              name: 'CSV',
              detail: 'Keine gültigen Zeilen gefunden. Erwartete Spalten: Property, Building, Floor, Unit, Asset',
            })
            return
          }

          setRows(data)
          processRows(data)
        },
        error: (err) => {
          setPhase('error')
          addLog({
            row: 0,
            level: 'Parser',
            action: 'error',
            name: 'CSV',
            detail: err.message,
          })
        },
      })
    },
    [addLog, processRows]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  // ── Stats ──────────────────────────────────────────────

  const created = log.filter((l) => l.action === 'created').length
  const existing = log.filter((l) => l.action === 'exists').length
  const errors = log.filter((l) => l.action === 'error').length

  // ── Render ─────────────────────────────────────────────

  return (
    <Box padding={4}>
      <Stack space={5}>
        <Heading as="h2" size={2}>
          CSV Import Wizard
        </Heading>

        <Text size={1} muted>
          Laden Sie eine CSV-Datei hoch, um die Liegenschafts-Hierarchie automatisch zu erstellen.
          Bestehende Einträge werden wiederverwendet (Upsert-Logik).
        </Text>

        {/* ── Drop Zone ───────────────────────────────── */}
        <Card
          padding={5}
          radius={3}
          shadow={1}
          tone={phase === 'error' ? 'critical' : phase === 'done' ? 'positive' : 'default'}
          style={{
            border: '2px dashed',
            borderColor: phase === 'idle' ? '#ccc' : undefined,
            textAlign: 'center',
            cursor: phase === 'importing' ? 'wait' : 'pointer',
          }}
          onDragOver={(e: React.DragEvent) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => phase !== 'importing' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />

          <Stack space={3}>
            {phase === 'idle' && (
              <>
                <Text size={3} weight="bold">CSV-Datei hier ablegen</Text>
                <Text size={1} muted>oder klicken zum Auswählen</Text>
                <Text size={0} muted>
                  Spalten: Property, Building, Floor, Unit, Asset (opt.), AssetType (opt.)
                </Text>
              </>
            )}
            {phase === 'parsing' && (
              <Text size={2} muted>Datei wird gelesen…</Text>
            )}
            {phase === 'importing' && (
              <>
                <Text size={2} weight="bold">
                  Import läuft: {progress.current} / {progress.total} Zeilen
                </Text>
                <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`,
                      height: '100%',
                      background: '#2563eb',
                      borderRadius: 3,
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
              </>
            )}
            {phase === 'done' && (
              <>
                <Text size={2} weight="bold">Import abgeschlossen</Text>
                <Flex gap={4} justify="center">
                  <Text size={1}>🟢 {created} erstellt</Text>
                  <Text size={1}>⚪ {existing} vorhanden</Text>
                  {errors > 0 && <Text size={1}>🔴 {errors} Fehler</Text>}
                </Flex>
              </>
            )}
            {phase === 'error' && (
              <Text size={2} weight="bold">Fehler beim Import</Text>
            )}
          </Stack>
        </Card>

        {/* ── Actions ─────────────────────────────────── */}
        {(phase === 'done' || phase === 'error') && (
          <Flex gap={3}>
            <Button
              text="Neuen Import starten"
              tone="primary"
              onClick={() => {
                setPhase('idle')
                setLog([])
                setRows([])
                setProgress({ current: 0, total: 0 })
              }}
            />
          </Flex>
        )}

        {/* ── CSV Format Reference ────────────────────── */}
        {phase === 'idle' && (
          <Card padding={4} radius={2} tone="transparent">
            <Stack space={3}>
              <Text size={1} weight="bold">Erwartetes CSV-Format:</Text>
              <Code language="csv" size={1}>
                {`Property,Building,Floor,Unit,Asset,AssetType
Areal Mitte,Haus A,Erdgeschoss,Wohnung 1.01,Waschmaschine,appliance
Areal Mitte,Haus A,Erdgeschoss,Wohnung 1.02,,
Areal Mitte,Haus B,1. OG,Büro 2.01,Klimaanlage,hvac`}
              </Code>
            </Stack>
          </Card>
        )}

        {/* ── Import Log ──────────────────────────────── */}
        {log.length > 0 && (
          <Card padding={4} radius={2} tone="transparent" style={{ maxHeight: 400, overflow: 'auto' }}>
            <Stack space={2}>
              <Text size={1} weight="bold">Import-Protokoll ({log.length} Einträge)</Text>
              {log.map((entry, i) => (
                <Text key={i} size={0} muted={entry.action === 'exists'}>
                  <span style={{ fontFamily: 'monospace' }}>
                    {entry.action === 'created' && '🟢'}
                    {entry.action === 'exists' && '⚪'}
                    {entry.action === 'error' && '🔴'}
                    {' '}Z{entry.row.toString().padStart(3, '0')} [{entry.level}] {entry.name}
                    {entry.detail && ` — ${entry.detail}`}
                  </span>
                </Text>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
