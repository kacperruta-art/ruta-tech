import { defineType, defineField, defineArrayMember } from 'sanity'
import { DoorOpen } from 'lucide-react'

export const unit = defineType({
  name: 'unit',
  title: 'Nutzungseinheit',
  type: 'document',
  icon: DoorOpen,
  groups: [
    { name: 'core', title: 'Grunddaten', default: true },
    { name: 'people', title: 'Personen' },
    { name: 'inventory', title: 'Inventar' },
    { name: 'security', title: 'Sicherheit' },
  ],
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),

    // --- Group: core ---
    defineField({
      name: 'building',
      title: 'Gebäude',
      type: 'reference',
      to: [{ type: 'building' }],
      group: 'core',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'floor',
      title: 'Stockwerk',
      type: 'reference',
      to: [{ type: 'floor' }],
      group: 'core',
    }),
    defineField({
      name: 'name',
      title: 'Bezeichnung',
      type: 'string',
      group: 'core',
      description: 'z.B. "Wohnung 3.01", "Büro 2A"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'core',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'type',
      title: 'Nutzungsart',
      type: 'string',
      group: 'core',
      options: {
        list: [
          { title: 'Wohnnutzung', value: 'residential' },
          { title: 'Gewerbenutzung', value: 'commercial' },
        ],
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'core',
      options: {
        list: [
          { title: 'Belegt', value: 'occupied' },
          { title: 'Leer', value: 'vacant' },
          { title: 'Renovation', value: 'renovation' },
        ],
      },
      initialValue: 'vacant',
    }),

    // --- Group: people ---
    defineField({
      name: 'tenants',
      title: 'Mieter (Vertragspartner)',
      type: 'array',
      group: 'people',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
    }),
    defineField({
      name: 'residents',
      title: 'Bewohner',
      type: 'array',
      group: 'people',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
    }),

    // --- Group: inventory ---
    defineField({
      name: 'smartAssets',
      title: 'Smart Assets (QR-aktiv)',
      type: 'array',
      group: 'inventory',
      of: [{ type: 'reference', to: [{ type: 'asset' }] }],
      description: 'Aktive Anlagen mit QR-Code.',
    }),
    defineField({
      name: 'fittings',
      title: 'Ausstattung (Passiv)',
      type: 'array',
      group: 'inventory',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fittingEntry',
          title: 'Ausstattungs-Element',
          fields: [
            defineField({
              name: 'category',
              title: 'Kategorie',
              type: 'string',
              options: {
                list: [
                  { title: 'Böden', value: 'floors' },
                  { title: 'Wände', value: 'walls' },
                  { title: 'Fenster', value: 'windows' },
                  { title: 'Türen', value: 'doors' },
                  { title: 'Küche', value: 'kitchen' },
                  { title: 'Bad', value: 'bathroom' },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'material',
              title: 'Material',
              type: 'string',
            }),
            defineField({
              name: 'condition',
              title: 'Zustand',
              type: 'string',
              options: {
                list: [
                  { title: 'Neuwertig', value: 'new' },
                  { title: 'Gut', value: 'good' },
                  { title: 'Abgenutzt', value: 'worn' },
                  { title: 'Defekt', value: 'defective' },
                ],
              },
            }),
            defineField({
              name: 'installYear',
              title: 'Einbaujahr',
              type: 'number',
              validation: (rule) => rule.integer().min(1900).max(2100),
            }),
          ],
          preview: {
            select: { category: 'category', material: 'material', condition: 'condition' },
            prepare({ category, material, condition }) {
              return {
                title: category ?? 'Eintrag',
                subtitle: [material, condition].filter(Boolean).join(' · '),
              }
            },
          },
        }),
      ],
    }),

    // --- Group: security ---
    defineField({
      name: 'keyRegistry',
      title: 'Schlüsselregister',
      type: 'array',
      group: 'security',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'keyEntry',
          title: 'Schlüssel',
          fields: [
            defineField({
              name: 'keyNumber',
              title: 'Schlüssel-Nr.',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'holder',
              title: 'Inhaber',
              type: 'reference',
              to: [{ type: 'user' }],
            }),
            defineField({
              name: 'type',
              title: 'Typ',
              type: 'string',
            }),
            defineField({
              name: 'issueDate',
              title: 'Ausgabedatum',
              type: 'date',
            }),
            defineField({
              name: 'isLost',
              title: 'Verloren',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: { key: 'keyNumber', lost: 'isLost' },
            prepare({ key, lost }) {
              return {
                title: key ?? 'Schlüssel',
                subtitle: lost ? '🔴 Verloren' : '🟢 Aktiv',
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', status: 'status', building: 'building.name' },
    prepare({ title, status, building }) {
      return {
        title: title || 'Unbenannt',
        subtitle: [building, status].filter(Boolean).join(' · '),
      }
    },
  },
})
