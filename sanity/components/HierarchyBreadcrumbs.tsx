'use client'

import { Flex, Text } from '@sanity/ui'
import { IntentLink } from 'sanity/router'
import { useFormValue, type InputProps } from 'sanity'

type ReferenceValue = {
  _ref?: string
  name?: string
} | null

type Crumb = {
  id?: string
  label: string
  type?: string
  isCurrent?: boolean
}

const labelOrUnknown = (value?: string | null) => value?.trim() || 'Unknown'

const resolveLabel = (fallback: string, value?: ReferenceValue) => {
  if (!value) return fallback
  if (value.name) return value.name
  if (value._ref) return `${fallback} (${value._ref.slice(0, 6)})`
  return fallback
}

export function HierarchyBreadcrumbs(_props: InputProps) {
  const type = useFormValue(['_type']) as string | undefined
  const name = useFormValue(['name']) as string | undefined
  const building = (useFormValue(['building']) ||
    useFormValue(['parentBuilding'])) as ReferenceValue
  const floor = (useFormValue(['floor']) ||
    useFormValue(['parentFloor'])) as ReferenceValue
  const unit = (useFormValue(['unit']) ||
    useFormValue(['parentUnit'])) as ReferenceValue

  const crumbs: Crumb[] = []

  if (type === 'asset') {
    if (building?._ref) {
      crumbs.push({
        id: building._ref,
        type: 'building',
        label: resolveLabel('Gebäude', building),
      })
    }
    if (floor?._ref) {
      crumbs.push({
        id: floor._ref,
        type: 'floor',
        label: resolveLabel('Ebene', floor),
      })
    }
    if (unit?._ref) {
      crumbs.push({
        id: unit._ref,
        type: 'unit',
        label: resolveLabel('Einheit', unit),
      })
    }
  }

  if (type === 'unit') {
    if (building?._ref) {
      crumbs.push({
        id: building._ref,
        type: 'building',
        label: resolveLabel('Gebäude', building),
      })
    }
    if (floor?._ref) {
      crumbs.push({
        id: floor._ref,
        type: 'floor',
        label: resolveLabel('Ebene', floor),
      })
    }
  }

  if (type === 'floor') {
    if (building?._ref) {
      crumbs.push({
        id: building._ref,
        type: 'building',
        label: resolveLabel('Gebäude', building),
      })
    }
  }

  crumbs.push({
    label: labelOrUnknown(name),
    isCurrent: true,
  })

  return (
    <Flex align="center" gap={2} paddingBottom={3} wrap="wrap">
      {crumbs.map((crumb, index) => (
        <Flex key={`${crumb.label}-${index}`} align="center" gap={2}>
          {crumb.isCurrent || !crumb.id ? (
            <Text size={1} weight="semibold">
              {labelOrUnknown(crumb.label)}
            </Text>
          ) : (
            <IntentLink intent="edit" params={{ id: crumb.id, type: crumb.type }}>
              <Text size={1} style={{ cursor: 'pointer', color: '#2276fc' }}>
                {labelOrUnknown(crumb.label)}
              </Text>
            </IntentLink>
          )}
          {index < crumbs.length - 1 && (
            <Text size={1} muted>
              {'>'}
            </Text>
          )}
        </Flex>
      ))}
    </Flex>
  )
}
