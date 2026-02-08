import {defineType, defineField} from 'sanity'
import {Gauge, History} from 'lucide-react'

export const meterReading = defineType({
  name: 'meterReading',
  title: 'Zählerstand',
  type: 'document',
  icon: Gauge,
  fields: [
    defineField({
      name: 'asset',
      title: 'Zähler (Asset)',
      type: 'reference',
      to: [{type: 'asset'}],
      options: {
        filter: 'isMeter == true',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Ablesedatum',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Zählerstand (Wert)',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'unit',
      title: 'Einheit',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'type',
      title: 'Ableseart',
      type: 'string',
      options: {
        list: [
          {title: 'Manuell (Vor Ort)', value: 'manual'},
          {title: 'IoT / Automatisch', value: 'iot'},
          {title: 'Einzug / Auszug', value: 'handover'},
          {title: 'Zwischenablesung', value: 'intermediate'},
        ],
      },
      initialValue: 'manual',
    }),
    defineField({
      name: 'image',
      title: 'Beweisfoto',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'readBy',
      title: 'Abgelesen durch',
      type: 'reference',
      to: [{type: 'user'}],
    }),
  ],
  preview: {
    select: {
      title: 'asset.name',
      value: 'value',
      date: 'date',
      unit: 'asset.meterUnit',
    },
    prepare({title, value, date, unit}) {
      const dateStr = date
        ? new Date(date).toLocaleDateString('de-CH')
        : ''
      return {
        title: `${value ?? ''} ${unit || ''}`,
        subtitle: `${dateStr} · ${title || ''}`,
        media: History,
      }
    },
  },
})
