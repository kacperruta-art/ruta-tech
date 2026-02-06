import { defineType, defineField } from 'sanity'
import { BookOpen } from 'lucide-react'

export const logbookEntry = defineType({
  name: 'logbookEntry',
  title: 'Logbuch-Eintrag',
  type: 'document',
  icon: BookOpen,
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'target',
      title: 'Zielobjekt',
      type: 'reference',
      to: [
        { type: 'asset' },
        { type: 'building' },
        { type: 'unit' },
        { type: 'floor' },
        { type: 'parkingFacility' },
      ],
      description: 'Polymorphe Referenz: Anlage, Gebäude, Einheit, Stockwerk oder Parkanlage.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Reparatur', value: 'repair' },
          { title: 'Wartung', value: 'maintenance' },
          { title: 'Inspektion', value: 'inspection' },
          { title: 'Notfall', value: 'emergency' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Datum',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'provider',
      title: 'Dienstleister',
      type: 'reference',
      to: [{ type: 'provider' }],
    }),
    defineField({
      name: 'cost',
      title: 'Kosten (CHF)',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'documents',
      title: 'Dokumente / Belege',
      type: 'array',
      of: [{ type: 'file' }],
    }),
  ],
  preview: {
    select: { type: 'type', date: 'date', target: 'target.name' },
    prepare({ type, date, target }) {
      const typeLabels: Record<string, string> = {
        repair: 'Reparatur',
        maintenance: 'Wartung',
        inspection: 'Inspektion',
        emergency: 'Notfall',
      }
      return {
        title: typeLabels[type] ?? type ?? 'Eintrag',
        subtitle: [target, date].filter(Boolean).join(' · '),
      }
    },
  },
})
