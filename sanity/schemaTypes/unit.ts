import { defineField, defineType } from 'sanity'
import { DashboardIcon } from '@sanity/icons'

export const unit = defineType({
  name: 'unit',
  title: 'Raum / Einheit',
  type: 'document',
  icon: DashboardIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Bezeichnung',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Wohnung', value: 'apartment' },
          { title: 'Büro', value: 'office' },
          { title: 'Parkplatz', value: 'parkingSlot' },
          { title: 'Technikraum', value: 'technical' },
          { title: 'Allgemein / Gang', value: 'commonArea' },
          { title: 'Lager / Kellerabteil', value: 'storage' },
        ],
      },
    }),
    defineField({
      name: 'floor',
      title: 'Auf Ebene',
      type: 'reference',
      to: [{ type: 'floor' }],
    }),
    defineField({
      name: 'building',
      title: 'Im Gebäude',
      type: 'reference',
      to: [{ type: 'building' }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'type' },
  },
})
