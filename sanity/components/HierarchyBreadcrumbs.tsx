'use client'

import { Card, Flex, Text } from '@sanity/ui'
import { IntentLink } from 'sanity/router'
import { useFormValue, type InputProps } from 'sanity'

type ReferenceValue = {
  _ref?: string
  name?: string
} | null

type BreadcrumbItem = {
  id?: string
  label: string
  type?: string
  isCurrent?: boolean
}

const getLabel = (fallback: string, value?: ReferenceValue) => {
  if (!value) return fallback
  if (value.name) return value.name
  if (value._ref) return `${fallback} (${value._ref.slice(0, 6)})`
  return fallback
}

const buildBreadcrumbs = ({
  type,
  name,
  building,
  floor,
  unit,
  parentFloor,
  parentUnit,
}: {
  type?: string
  name?: string
  building?: ReferenceValue
  floor?: ReferenceValue
  unit?: ReferenceValue
  parentFloor?: ReferenceValue
  parentUnit?: ReferenceValue
}) => {
  const currentLabel = name || 'Aktuelles Dokument'

  if (type === 'asset') {
    return [
      {
        id: building?._ref,
        label: getLabel('Gebäude', building),
        type: 'building',
      },
      {
        id: (parentFloor?._ref || floor?._ref),
        label: getLabel('Ebene', parentFloor || floor),
        type: 'floor',
      },
      {
        id: (parentUnit?._ref || unit?._ref),
        label: getLabel('Einheit', parentUnit || unit),
        type: 'unit',
      },
      { label: currentLabel, isCurrent: true },
    ].filter((item, index, arr) =>
      item.isCurrent ? true : Boolean(item.id || (index === 0 && arr.length))
    )
  }

  if (type === 'unit') {
    return [
      {
        id: building?._ref,
        label: getLabel('Gebäude', building),
        type: 'building',
      },
      {
        id: floor?._ref,
        label: getLabel('Ebene', floor),
        type: 'floor',
      },
      { label: currentLabel, isCurrent: true },
    ].filter((item, index, arr) =>
      item.isCurrent ? true : Boolean(item.id || (index === 0 && arr.length))
    )
  }

  if (type === 'floor') {
    return [
      {
        id: building?._ref,
        label: getLabel('Gebäude', building),
        type: 'building',
      },
      { label: currentLabel, isCurrent: true },
    ].filter((item, index, arr) =>
      item.isCurrent ? true : Boolean(item.id || (index === 0 && arr.length))
    )
  }

  return [{ label: currentLabel, isCurrent: true }]
}

export function HierarchyBreadcrumbs(props: InputProps) {
  const type = useFormValue(['_type']) as string | undefined
  const name = useFormValue(['name']) as string | undefined
  const building = useFormValue(['building']) as ReferenceValue
  const floor = useFormValue(['floor']) as ReferenceValue
  const unit = useFormValue(['unit']) as ReferenceValue
  const parentFloor = useFormValue(['parentFloor']) as ReferenceValue
  const parentUnit = useFormValue(['parentUnit']) as ReferenceValue

  const breadcrumbs = buildBreadcrumbs({
    type,
    name,
    building,
    floor,
    unit,
    parentFloor,
    parentUnit,
  })

  return (
    <Flex direction="column" gap={3}>
      <Card padding={3} radius={2} tone="transparent" border>
        <Flex align="center" gap={2} wrap="wrap">
          {breadcrumbs.map((item, index) => (
            <Flex key={`${item.label}-${index}`} align="center" gap={2}>
              {item.isCurrent || !item.id || !item.type ? (
                <Text size={1} weight={item.isCurrent ? 'semibold' : 'regular'}>
                  {item.label}
                </Text>
              ) : (
                <IntentLink intent="edit" params={{ id: item.id, type: item.type }}>
                  <Text size={1} weight="semibold" style={{ color: '#555' }}>
                    {item.label}
                  </Text>
                </IntentLink>
              )}
              {index < breadcrumbs.length - 1 && (
                <Text size={1} style={{ color: '#999' }}>
                  →
                </Text>
              )}
            </Flex>
          ))}
        </Flex>
      </Card>
      {props.renderDefault(props)}
    </Flex>
  )
}
