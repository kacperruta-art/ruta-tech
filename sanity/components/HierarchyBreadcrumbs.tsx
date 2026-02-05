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

type FetchedNode = {
  name?: string | null
  title?: string | null
  clientName?: string | null
  clientId?: string | null
}

const apiVersion = '2024-01-01'

const labelFromNode = (node?: FetchedNode | null, fallback = 'Unknown') =>
  node?.name?.trim() || node?.title?.trim() || fallback

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

  const [buildingNode, setBuildingNode] = useState<FetchedNode | null>(null)
  const [floorNode, setFloorNode] = useState<FetchedNode | null>(null)
  const [unitNode, setUnitNode] = useState<FetchedNode | null>(null)
  const [clientNode, setClientNode] = useState<FetchedNode | null>(null)

  useEffect(() => {
    const load = async () => {
      const queries: Array<Promise<void>> = []

      if (building?._ref) {
        queries.push(
          client
            .fetch<FetchedNode>(
              `*[_id == $id][0]{ name, title, "clientName": client->name }`,
              { id: building._ref }
            )
            .then((result) => setBuildingNode(result ?? null))
            .catch(() => setBuildingNode(null))
        )
        queries.push(
          client
            .fetch<FetchedNode>(
              `*[_id == $id][0]{ "clientName": client->name, "clientId": client->_id }`,
              { id: building._ref }
            )
            .then((result) => setClientNode(result ?? null))
            .catch(() => setClientNode(null))
        )
      } else {
        setBuildingNode(null)
        setClientNode(null)
      }

      if (floor?._ref) {
        queries.push(
          client
            .fetch<FetchedNode>(
              `*[_id == $id][0]{ name, title }`,
              { id: floor._ref }
            )
            .then((result) => setFloorNode(result ?? null))
            .catch(() => setFloorNode(null))
        )
      } else {
        setFloorNode(null)
      }

      if (unit?._ref) {
        queries.push(
          client
            .fetch<FetchedNode>(
              `*[_id == $id][0]{ name, title }`,
              { id: unit._ref }
            )
            .then((result) => setUnitNode(result ?? null))
            .catch(() => setUnitNode(null))
        )
      } else {
        setUnitNode(null)
      }

      if (queries.length) {
        await Promise.all(queries)
      }
    }

    load()
  }, [building?._ref, client, floor?._ref, unit?._ref])

  const crumbs = useMemo(() => {
    const chain: ResolvedNode[] = []
    const clientName = clientNode?.clientName
    const clientId = (clientNode as { clientId?: string })?.clientId

    if (clientName) {
      chain.push({
        id: clientId || '',
        label: clientName,
        type: 'client',
      })
    }

    if (building?._ref) {
      chain.push({
        id: building._ref,
        label: labelFromNode(buildingNode, 'Unknown'),
        type: 'building',
      })
    }

    if (type === 'asset' || type === 'unit' || type === 'floor') {
      if (type !== 'floor' && floor?._ref) {
        chain.push({
          id: floor._ref,
          label: labelFromNode(floorNode, 'Unknown'),
          type: 'floor',
        })
      }
    }

    if (type === 'asset' || type === 'unit') {
      if (unit?._ref) {
        chain.push({
          id: unit._ref,
          label: labelFromNode(unitNode, 'Unknown'),
          type: 'unit',
        })
      }
    }

    return chain
  }, [building?._ref, buildingNode, floor?._ref, floorNode, type, unit?._ref, unitNode])

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
