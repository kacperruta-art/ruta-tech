import { defineType, defineField, defineArrayMember } from 'sanity'
import { Home } from 'lucide-react'

const cantonOptions = [
  { title: 'Zürich', value: 'ZH' },
  { title: 'Bern', value: 'BE' },
  { title: 'Luzern', value: 'LU' },
  { title: 'Uri', value: 'UR' },
  { title: 'Schwyz', value: 'SZ' },
  { title: 'Obwalden', value: 'OW' },
  { title: 'Nidwalden', value: 'NW' },
  { title: 'Glarus', value: 'GL' },
  { title: 'Zug', value: 'ZG' },
  { title: 'Freiburg', value: 'FR' },
  { title: 'Solothurn', value: 'SO' },
  { title: 'Basel-Stadt', value: 'BS' },
  { title: 'Basel-Landschaft', value: 'BL' },
  { title: 'Schaffhausen', value: 'SH' },
  { title: 'Appenzell A.Rh.', value: 'AR' },
  { title: 'Appenzell I.Rh.', value: 'AI' },
  { title: 'St. Gallen', value: 'SG' },
  { title: 'Graubünden', value: 'GR' },
  { title: 'Aargau', value: 'AG' },
  { title: 'Thurgau', value: 'TG' },
  { title: 'Tessin', value: 'TI' },
  { title: 'Waadt', value: 'VD' },
  { title: 'Wallis', value: 'VS' },
  { title: 'Neuenburg', value: 'NE' },
  { title: 'Genf', value: 'GE' },
  { title: 'Jura', value: 'JU' },
]

const serviceRoleOptions = [
  { title: 'Facility Management', value: 'facility' },
  { title: 'HLKS', value: 'hvac' },
  { title: 'Aufzug', value: 'lift' },
  { title: 'Elektro', value: 'electrician' },
  { title: 'Reinigung', value: 'cleaning' },
  { title: 'Sicherheit', value: 'security' },
  { title: 'Verwaltung', value: 'management' },
]

export const building = defineType({
  name: 'building',
  title: 'Gebäude',
  type: 'document',
  icon: Home,
  groups: [
    { name: 'context', title: 'Kontext', default: true },
    { name: 'tech', title: 'Technik' },
    { name: 'access', title: 'Zugang' },
    { name: 'services', title: 'Dienstleister-Matrix' },
  ],
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),

    // --- Group: context ---
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'context',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'context',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'property',
      title: 'Liegenschaft',
      type: 'reference',
      to: [{ type: 'property' }],
      group: 'context',
    }),
    defineField({
      name: 'address',
      title: 'Adresse',
      type: 'object',
      group: 'context',
      fields: [
        defineField({ name: 'street', title: 'Strasse', type: 'string' }),
        defineField({ name: 'zip', title: 'PLZ', type: 'string' }),
        defineField({ name: 'city', title: 'Ort', type: 'string' }),
        defineField({
          name: 'canton',
          title: 'Kanton',
          type: 'string',
          options: { list: cantonOptions },
        }),
      ],
    }),

    // --- Group: tech ---
    defineField({
      name: 'heatingType',
      title: 'Heizungstyp',
      type: 'string',
      group: 'tech',
      options: {
        list: [
          { title: 'Gas', value: 'gas' },
          { title: 'Öl', value: 'oil' },
          { title: 'Wärmepumpe', value: 'heatpump' },
          { title: 'Fernwärme', value: 'district' },
        ],
      },
    }),
    defineField({
      name: 'constructionYear',
      title: 'Baujahr',
      type: 'number',
      group: 'tech',
      validation: (rule) => rule.integer().min(1800).max(2100),
    }),

    // --- Group: access ---
    defineField({
      name: 'chatAccessPin',
      title: 'Chat-Zugangs-PIN',
      type: 'string',
      group: 'access',
      description: '4-stelliger PIN für den Chat-Zugang.',
      validation: (rule) =>
        rule.regex(/^\d{4}$/, { name: '4-digit PIN', invert: false }),
    }),
    defineField({
      name: 'keySystem',
      title: 'Schlüsselsystem',
      type: 'string',
      group: 'access',
    }),

    // --- Group: services (CRITICAL) ---
    defineField({
      name: 'serviceProviders',
      title: 'Dienstleister-Matrix',
      type: 'array',
      group: 'services',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'serviceProviderEntry',
          title: 'Eintrag',
          fields: [
            defineField({
              name: 'role',
              title: 'Rolle / Gewerk',
              type: 'string',
              options: { list: serviceRoleOptions },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'provider',
              title: 'Dienstleister',
              type: 'reference',
              to: [{ type: 'provider' }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'customNote',
              title: 'Anmerkung',
              type: 'string',
            }),
            defineField({
              name: 'priority',
              title: 'Priorität',
              type: 'string',
              options: {
                list: [
                  { title: 'Primär', value: 'primary' },
                  { title: 'Backup', value: 'backup' },
                ],
              },
              initialValue: 'primary',
            }),
          ],
          preview: {
            select: { role: 'role', provider: 'provider.companyName', priority: 'priority' },
            prepare({ role, provider, priority }) {
              return {
                title: `${role ?? '–'} → ${provider ?? '–'}`,
                subtitle: priority === 'backup' ? '⚠ Backup' : 'Primär',
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', city: 'address.city' },
    prepare({ title, city }) {
      return {
        title: title || 'Unbenannt',
        subtitle: city ?? '',
      }
    },
  },
})
