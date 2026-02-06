import { defineType, defineField } from 'sanity'
import { Building2 } from 'lucide-react'

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

export const tenant = defineType({
  name: 'tenant',
  title: 'Mandant',
  type: 'document',
  icon: Building2,
  groups: [
    { name: 'identity', title: 'Identität', default: true },
    { name: 'branding', title: 'Branding' },
    { name: 'localization', title: 'Lokalisierung' },
    { name: 'legal', title: 'Rechtliches' },
    { name: 'ai', title: 'KI-Konfiguration' },
  ],
  fields: [
    // --- Group: identity ---
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'ID (Slug)',
      type: 'slug',
      group: 'identity',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'domains',
      title: 'Domains',
      type: 'array',
      group: 'identity',
      of: [{ type: 'string' }],
      description: 'Index 0 ist die primäre Domain.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Aktiv', value: 'active' },
          { title: 'Gesperrt', value: 'suspended' },
          { title: 'Wartung', value: 'maintenance' },
        ],
      },
      initialValue: 'active',
    }),

    // --- Group: branding ---
    defineField({
      name: 'brandPrimary',
      title: 'Primärfarbe',
      type: 'string',
      group: 'branding',
      description: 'Hex-Farbcode, z.B. #0066AA',
      validation: (rule) =>
        rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
          name: 'hex color',
          invert: false,
        }),
    }),
    defineField({
      name: 'logoLight',
      title: 'Logo (Hell)',
      type: 'image',
      group: 'branding',
      options: { hotspot: true },
    }),
    defineField({
      name: 'logoDark',
      title: 'Logo (Dunkel)',
      type: 'image',
      group: 'branding',
      options: { hotspot: true },
    }),

    // --- Group: localization ---
    defineField({
      name: 'defaultLocale',
      title: 'Standard-Sprache',
      type: 'string',
      group: 'localization',
      options: {
        list: [
          { title: 'Deutsch (CH)', value: 'de-CH' },
          { title: 'Französisch (CH)', value: 'fr-CH' },
          { title: 'Italienisch (CH)', value: 'it-CH' },
          { title: 'English', value: 'en' },
        ],
      },
      initialValue: 'de-CH',
    }),
    defineField({
      name: 'supportedLocales',
      title: 'Unterstützte Sprachen',
      type: 'array',
      group: 'localization',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Deutsch (CH)', value: 'de-CH' },
          { title: 'Französisch (CH)', value: 'fr-CH' },
          { title: 'Italienisch (CH)', value: 'it-CH' },
          { title: 'English', value: 'en' },
        ],
      },
    }),

    // --- Group: legal ---
    defineField({
      name: 'legalName',
      title: 'Firmenname (Rechtlich)',
      type: 'string',
      group: 'legal',
    }),
    defineField({
      name: 'address',
      title: 'Adresse',
      type: 'object',
      group: 'legal',
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
    defineField({
      name: 'supportEmail',
      title: 'Support E-Mail',
      type: 'string',
      group: 'legal',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'supportPhone',
      title: 'Support Telefon',
      type: 'string',
      group: 'legal',
    }),

    // --- Group: ai ---
    defineField({
      name: 'toneOfVoice',
      title: 'Tonalität',
      type: 'string',
      group: 'ai',
      options: {
        list: [
          { title: 'Formell (Sie)', value: 'formal' },
          { title: 'Direkt (Du)', value: 'direct' },
        ],
      },
      initialValue: 'formal',
    }),
    defineField({
      name: 'autoReply',
      title: 'Automatische Antwort',
      type: 'boolean',
      group: 'ai',
      initialValue: true,
    }),
    defineField({
      name: 'escalationKeywords',
      title: 'Eskalations-Schlüsselwörter',
      type: 'array',
      group: 'ai',
      of: [{ type: 'string' }],
      description: 'Wörter, die eine sofortige Eskalation auslösen.',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'status' },
  },
})
