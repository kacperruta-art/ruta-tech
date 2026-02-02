import { DashboardIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

const unitTypeOptions = [
  { title: 'Wohnung', value: 'apartment' },
  { title: 'Büro', value: 'office' },
  { title: 'Parkplatz', value: 'parkingSlot' },
  { title: 'Allgemein/Gang', value: 'commonArea' },
  { title: 'Technikraum', value: 'technical' },
]

export const unit = defineType({
  name: 'unit',
  title: 'Raum / Einheit',
  type: 'document',
  icon: DashboardIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Bezeichnung',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      type: 'string',
      title: 'Typ',
      options: {
        list: unitTypeOptions,
      },
    }),
    defineField({
      name: 'floor',
      type: 'reference',
      title: 'Auf Ebene',
      to: [{ type: 'floor' }],
    }),
    defineField({
      name: 'building',
      type: 'reference',
      title: 'Im Gebäude',
      to: [{ type: 'building' }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      name: 'name',
      type: 'type',
    },
    prepare({ name, type }) {
      return {
        title: name || 'Unbenannt',
        subtitle: type,
      }
    },
  },
})
import { DocumentIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const unit = defineType({
  name: 'unit',
  title: 'Wohnung',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'tenantName',
      type: 'string',
      title: 'Tenant Name',
    }),
    defineField({
      name: 'parentFloor',
      type: 'reference',
      to: [{ type: 'floor' }],
      title: 'Parent Floor',
    }),
  ],
  preview: {
    select: { name: 'name', tenantName: 'tenantName', floorName: 'parentFloor.name' },
    prepare({ name, tenantName, floorName }) {
      return {
        title: name,
        subtitle: [tenantName, floorName].filter(Boolean).join(' • ') || undefined,
      }
    },
  },
})
