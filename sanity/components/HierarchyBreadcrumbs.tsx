'use client'

import { Card, Flex, Text } from '@sanity/ui'
import { IntentLink } from 'sanity/router'
import { useClient, useFormValue, type InputProps } from 'sanity'
import { useEffect, useMemo, useState } from 'react'

type ReferenceValue = { _ref?: string } | null

type ResolvedNode = {
  id: string
  label: string
  type: 'client' | 'building' | 'floor' | 'unit'
}

type ClientNode = { _id?: string | null; name?: string | null }
type BuildingNode = { _id?: string | null; name?: string | null; client?: ClientNode | null }
type FloorNode = { _id?: string | null; name?: string | null; building?: BuildingNode | null }
type UnitNode = { _id?: string | null; name?: string | null; floor?: FloorNode | null; building?: BuildingNode | null }

type ResolvedHierarchy = {
  client?: ClientNode | null
  building?: BuildingNode | null
  floor?: FloorNode | null
  unit?: UnitNode | null
}

const apiVersion = '2024-01-01'

const labelFromNode = (name?: string | null, fallback = 'Unknown') =>
  name?.trim() || fallback

export function HierarchyBreadcrumbs(_props: InputProps) {
  const client = useClient({ apiVersion })

  const type = useFormValue(['_type']) as string | undefined
  const currentName = useFormValue(['name']) as string | undefined
  const building = (useFormValue(['building']) ||
    useFormValue(['parentBuilding'])) as ReferenceValue
  const floor = (useFormValue(['floor']) ||
    useFormValue(['parentFloor'])) as ReferenceValue
  const unit = (useFormValue(['unit']) ||
    useFormValue(['parentUnit'])) as ReferenceValue
  const parentUnit = useFormValue(['parentUnit']) as ReferenceValue
  const parentFloor = useFormValue(['parentFloor']) as ReferenceValue

  const [resolved, setResolved] = useState<ResolvedHierarchy>({})

  useEffect(() => {
    const load = async () => {
      const queries: Array<Promise<void>> = []

      const unitRef = parentUnit?._ref || unit?._ref
      const floorRef = parentFloor?._ref || floor?._ref
      const buildingRef = building?._ref

      if (unitRef) {
        queries.push(
          client
            .fetch<UnitNode>(
              `*[_id == $id][0]{
                _id,
                name,
                floor->{ _id, name, "building": building->{ _id, name, "client": client->{ _id, name } } },
                "building": building->{ _id, name, "client": client->{ _id, name } }
              }`,
              { id: unitRef }
            )
            .then((result) => {
              const unitNode = result ?? null
              const floorNode = unitNode?.floor ?? null
              const buildingNode = floorNode?.building ?? unitNode?.building ?? null
              const clientNode = buildingNode?.client ?? null
              setResolved({
                unit: unitNode,
                floor: floorNode,
                building: buildingNode,
                client: clientNode,
              })
            })
            .catch(() => setResolved({}))
        )
      } else if (floorRef) {
        queries.push(
          client
            .fetch<FloorNode>(
              `*[_id == $id][0]{
                _id,
                name,
                "building": building->{ _id, name, "client": client->{ _id, name } }
              }`,
              { id: floorRef }
            )
            .then((result) => {
              const floorNode = result ?? null
              const buildingNode = floorNode?.building ?? null
              const clientNode = buildingNode?.client ?? null
              setResolved({
                floor: floorNode,
                building: buildingNode,
                client: clientNode,
              })
            })
            .catch(() => setResolved({}))
        )
      } else if (buildingRef) {
        queries.push(
          client
            .fetch<BuildingNode>(
              `*[_id == $id][0]{ _id, name, "client": client->{ _id, name } }`,
              { id: buildingRef }
            )
            .then((result) => {
              const buildingNode = result ?? null
              const clientNode = buildingNode?.client ?? null
              setResolved({ building: buildingNode, client: clientNode })
            })
            .catch(() => setResolved({}))
        )
      } else {
        setResolved({})
      }

      if (queries.length) await Promise.all(queries)
    }

    load()
  }, [building?._ref, client, floor?._ref, parentFloor?._ref, parentUnit?._ref, unit?._ref])

  const crumbs = useMemo(() => {
    const chain: ResolvedNode[] = []

    if (resolved.client?._id) {
      chain.push({
        id: resolved.client._id,
        label: labelFromNode(resolved.client.name, 'Unknown'),
        type: 'client',
      })
    }

    if (resolved.building?._id) {
      chain.push({
        id: resolved.building._id,
        label: labelFromNode(resolved.building.name, 'Unknown'),
        type: 'building',
      })
    }

    if ((type === 'asset' || type === 'unit' || type === 'floor') && resolved.floor?._id) {
      chain.push({
        id: resolved.floor._id,
        label: labelFromNode(resolved.floor.name, 'Unknown'),
        type: 'floor',
      })
    }

    if ((type === 'asset' || type === 'unit') && resolved.unit?._id) {
      chain.push({
        id: resolved.unit._id,
        label: labelFromNode(resolved.unit.name, 'Unknown'),
        type: 'unit',
      })
    }

    return chain
  }, [resolved, type])

  const currentLabel = currentName?.trim() || 'Unknown'

  return (
    <Card paddingBottom={4} style={{ marginTop: -3 }}>
      <Flex align="center" gap={2} wrap="wrap">
        {crumbs.map((crumb, index) => (
          <Flex key={`${crumb.label}-${index}`} align="center" gap={2}>
            <IntentLink intent="edit" params={{ id: crumb.id, type: crumb.type }}>
              <Text size={3} style={{ cursor: 'pointer', color: '#2276fc' }}>
                {crumb.label}
              </Text>
            </IntentLink>
            <Text size={3} muted>
              {'>'}
            </Text>
          </Flex>
        ))}
        <Text size={3} weight="bold">
          {currentLabel}
        </Text>
      </Flex>
    </Card>
  )
}
