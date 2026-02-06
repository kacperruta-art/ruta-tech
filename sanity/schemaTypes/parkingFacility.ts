import { defineType, defineField, defineArrayMember } from 'sanity'
import { Car } from 'lucide-react'

export const parkingSpot = defineType({
  name: 'parkingSpot',
  title: 'Parkplatz-Eintrag',
  type: 'object',
  fields: [
    defineField({
      name: 'number',
      title: 'Nummer',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Standard', value: 'standard' },
          { title: 'E-Fahrzeug', value: 'ev' },
          { title: 'Besucher', value: 'visitor' },
        ],
      },
      initialValue: 'standard',
    }),
    defineField({
      name: 'linkedUnit',
      title: 'Zugeordnete Einheit',
      type: 'reference',
      to: [{ type: 'unit' }],
    }),
    defineField({
      name: 'features',
      title: 'Ausstattung',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'E-Ladestation', value: 'ev_charger' },
          { title: 'Aufbewahrungsbox', value: 'storage_box' },
        ],
      },
    }),
  ],
  preview: {
    select: { number: 'number', type: 'type' },
    prepare({ number, type }) {
      return {
        title: `PP ${number ?? '–'}`,
        subtitle: type ?? '',
      }
    },
  },
})

export const parkingFacility = defineType({
  name: 'parkingFacility',
  title: 'Parkanlage',
  type: 'document',
  icon: Car,
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Bezeichnung',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Tiefgarage', value: 'underground' },
          { title: 'Aussenparkplatz', value: 'outdoor' },
        ],
      },
    }),
    defineField({
      name: 'connectedBuildings',
      title: 'Zugehörige Gebäude',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'building' }] }],
    }),
    defineField({
      name: 'gateAccess',
      title: 'Zufahrtskontrolle',
      type: 'object',
      fields: [
        defineField({
          name: 'method',
          title: 'Methode',
          type: 'string',
          options: {
            list: [
              { title: 'Fernbedienung', value: 'remote' },
              { title: 'Badge / Chip', value: 'badge' },
              { title: 'Code', value: 'code' },
              { title: 'App', value: 'app' },
            ],
          },
        }),
        defineField({
          name: 'code',
          title: 'Zugangscode',
          type: 'string',
        }),
        defineField({
          name: 'frequency',
          title: 'Frequenz (MHz)',
          type: 'string',
          description: 'z.B. "868.3 MHz"',
        }),
      ],
    }),
    defineField({
      name: 'spots',
      title: 'Parkplätze',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'parkingSpot',
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', type: 'type' },
    prepare({ title, type }) {
      return {
        title: title || 'Parkanlage',
        subtitle: type === 'underground' ? 'Tiefgarage' : type === 'outdoor' ? 'Aussen' : '',
      }
    },
  },
})
