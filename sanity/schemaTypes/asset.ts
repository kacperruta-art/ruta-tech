import { defineType, defineField } from 'sanity'
import { Package } from 'lucide-react'

export const asset = defineType({
  name: 'asset',
  title: 'Anlage / Gerät',
  type: 'document',
  icon: Package,
  groups: [
    { name: 'identity', title: 'Identität', default: true },
    { name: 'specs', title: 'Spezifikationen' },
    { name: 'location', title: 'Standort' },
    { name: 'docs', title: 'Dokumente' },
  ],
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),

    // --- Group: identity ---
    defineField({
      name: 'name',
      title: 'Bezeichnung',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'qrCodeId',
      title: 'QR-Code ID',
      type: 'slug',
      group: 'identity',
      description: 'Eindeutige ID für den QR-Code.',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Bild',
      type: 'image',
      group: 'identity',
      options: { hotspot: true },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Aktiv', value: 'active' },
          { title: 'Inaktiv', value: 'inactive' },
          { title: 'Defekt', value: 'defective' },
          { title: 'Entsorgt', value: 'disposed' },
        ],
      },
      initialValue: 'active',
    }),

    // --- Group: specs ---
    defineField({
      name: 'manufacturer',
      title: 'Hersteller',
      type: 'string',
      group: 'specs',
    }),
    defineField({
      name: 'model',
      title: 'Modell',
      type: 'string',
      group: 'specs',
    }),
    defineField({
      name: 'serialNumber',
      title: 'Seriennummer',
      type: 'string',
      group: 'specs',
    }),
    defineField({
      name: 'installDate',
      title: 'Installationsdatum',
      type: 'date',
      group: 'specs',
    }),
    defineField({
      name: 'warrantyEnd',
      title: 'Garantie bis',
      type: 'date',
      group: 'specs',
    }),

    // --- Group: location (Polymorphic) ---
    defineField({
      name: 'location',
      title: 'Standort',
      type: 'reference',
      group: 'location',
      to: [
        { type: 'property' },
        { type: 'building' },
        { type: 'floor' },
        { type: 'unit' },
        { type: 'parkingFacility' },
      ],
      description:
        'Polymorphe Zuordnung: Liegenschaft, Gebäude, Stockwerk, Einheit oder Parkanlage.',
    }),

    // --- Group: docs ---
    defineField({
      name: 'documents',
      title: 'Dokumente',
      type: 'array',
      group: 'docs',
      of: [{ type: 'file' }],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      manufacturer: 'manufacturer',
      model: 'model',
      media: 'image',
    },
    prepare({ title, manufacturer, model, media }) {
      const sub = [manufacturer, model].filter(Boolean).join(' ')
      return {
        title: title || 'Unbenannt',
        subtitle: sub || undefined,
        media,
      }
    },
  },
})
