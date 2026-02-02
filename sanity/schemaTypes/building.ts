import {
  HomeIcon,
  ThListIcon,
  DocumentIcon,
  NumberIcon,
  ArrowRightIcon,
  UsersIcon,
  DatabaseIcon,
} from '@sanity/icons'
import { defineType, defineField, defineArrayMember } from 'sanity'

const usageUnitTypeOptions = [
  { title: 'Wohnung', value: 'Apartment' },
  { title: 'Büro', value: 'Office' },
  { title: 'Laden', value: 'Retail' },
]

const commonAreaTypeOptions = [
  { title: 'Waschküche', value: 'Laundry' },
  { title: 'Gang', value: 'Corridor' },
  { title: 'Technik', value: 'Technical' },
  { title: 'Lager', value: 'Storage' },
]

const buildingCertificateTypeOptions = [
  { title: 'GEAK / CECB', value: 'GEAK/CECB' },
  { title: 'Minergie', value: 'Minergie' },
  { title: 'Brandschutz', value: 'FireSafety' },
  { title: 'Aufzugsicherheit', value: 'ElevatorSafety' },
]

const heatingTypeOptions = [
  { title: 'Wärmepumpe', value: 'HeatPump' },
  { title: 'Öl', value: 'Oil' },
  { title: 'Gas', value: 'Gas' },
  { title: 'Fernwärme', value: 'District' },
]

const typeTitleMap = (options: { title: string; value: string }[]) =>
  new Map(options.map((option) => [option.value, option.title]))

const usageUnitTypeTitles = typeTitleMap(usageUnitTypeOptions)
const commonAreaTypeTitles = typeTitleMap(commonAreaTypeOptions)

const managerEntry = defineArrayMember({
  type: 'object',
  name: 'managerEntry',
  title: 'Kontakt',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'kind',
      type: 'string',
      title: 'Typ',
      options: {
        list: [
          { title: 'Kontaktangaben', value: 'contact' },
          { title: 'Firma (Referenz)', value: 'client' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contact',
      type: 'string',
      title: 'Kontaktangaben',
      description: 'Name, Telefon oder E-Mail.',
      hidden: ({ parent }) => parent?.kind === 'client',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { kind?: string; client?: unknown } | undefined
          if (parent?.kind === 'contact' && !value) {
            return 'Kontaktangaben sind erforderlich.'
          }
          return true
        }),
    }),
    defineField({
      name: 'client',
      type: 'reference',
      to: [{ type: 'client' }],
      title: 'Firma',
      hidden: ({ parent }) => parent?.kind === 'contact',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { kind?: string; contact?: unknown } | undefined
          if (parent?.kind === 'client' && !value) {
            return 'Bitte eine Firma auswählen.'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      kind: 'kind',
      contact: 'contact',
      clientName: 'client.name',
    },
    prepare({ kind, contact, clientName }) {
      const title =
        kind === 'client' ? clientName || 'Firma' : contact || 'Kontaktangaben'
      return {
        title,
        subtitle: kind === 'client' ? 'Firma' : 'Kontakt',
      }
    },
  },
})

export const usageUnit = defineType({
  name: 'usageUnit',
  title: 'Mietobjekt',
  type: 'object',
  icon: DocumentIcon,
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
      title: 'Nutzung',
      options: { list: usageUnitTypeOptions },
    }),
    defineField({
      name: 'tenantName',
      type: 'string',
      title: 'Mieter',
    }),
  ],
  preview: {
    select: { name: 'name', type: 'type' },
    prepare({ name, type }) {
      return {
        title: name || 'Unbenannt',
        subtitle: type ? usageUnitTypeTitles.get(type) : undefined,
      }
    },
  },
})

export const commonArea = defineType({
  name: 'commonArea',
  title: 'Allgemeiner Bereich',
  type: 'object',
  icon: ThListIcon,
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
      title: 'Kategorie',
      options: { list: commonAreaTypeOptions },
    }),
  ],
  preview: {
    select: { name: 'name', type: 'type' },
    prepare({ name, type }) {
      return {
        title: name || 'Unbenannt',
        subtitle: type ? commonAreaTypeTitles.get(type) : undefined,
      }
    },
  },
})

export const floor = defineType({
  name: 'floor',
  title: 'Stockwerk',
  type: 'object',
  icon: NumberIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Bezeichnung',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'level',
      type: 'number',
      title: 'Ebene (Sortierung)',
    }),
    defineField({
      name: 'units',
      type: 'array',
      title: 'Mietobjekte / Wohnungen',
      of: [defineArrayMember({ type: 'usageUnit' })],
    }),
    defineField({
      name: 'commonAreas',
      type: 'array',
      title: 'Allgemeine Bereiche (Gang, WC, etc.)',
      of: [defineArrayMember({ type: 'commonArea' })],
    }),
  ],
  preview: {
    select: { name: 'name', units: 'units' },
    prepare({ name, units }) {
      const count = Array.isArray(units) ? units.length : 0
      return {
        title: name || 'Unbenannt',
        subtitle: `${count} Mietobjekt${count === 1 ? '' : 'e'}`,
      }
    },
  },
})

export const zoneItem = defineType({
  name: 'zoneItem',
  title: 'Zonenplatz',
  type: 'object',
  icon: ArrowRightIcon,
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
    }),
  ],
  preview: {
    select: { name: 'name', type: 'type' },
    prepare({ name, type }) {
      return {
        title: name || 'Unbenannt',
        subtitle: type || undefined,
      }
    },
  },
})

export const zone = defineType({
  name: 'zone',
  title: 'Zone',
  type: 'object',
  icon: DatabaseIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Bezeichnung',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'items',
      type: 'array',
      title: 'Plätze / Räume',
      of: [defineArrayMember({ type: 'zoneItem' })],
    }),
  ],
  preview: {
    select: { name: 'name', items: 'items' },
    prepare({ name, items }) {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: name || 'Unbenannt',
        subtitle: `${count} Eintrag${count === 1 ? '' : 'e'}`,
      }
    },
  },
})

export const buildingCertificate = defineType({
  name: 'buildingCertificate',
  title: 'Zertifikat',
  type: 'object',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'type',
      type: 'string',
      title: 'Typ',
      options: { list: buildingCertificateTypeOptions },
    }),
    defineField({
      name: 'issueDate',
      type: 'date',
      title: 'Ausstellungsdatum',
    }),
    defineField({
      name: 'validUntil',
      type: 'date',
      title: 'Gültig bis',
    }),
    defineField({
      name: 'file',
      type: 'file',
      title: 'Datei',
    }),
  ],
})

export const building = defineType({
  name: 'building',
  title: 'Gebäude',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'basis', title: 'Basisdaten', default: true, icon: HomeIcon },
    { name: 'structure', title: 'Struktur', icon: ThListIcon },
    { name: 'dna', title: 'Technische Daten', icon: DatabaseIcon },
    { name: 'docs', title: 'Dokumente', icon: DocumentIcon },
  ],
  fieldsets: [
    { name: 'address', title: 'Adresse', options: { columns: 2 } },
    { name: 'systems', title: 'Systeme', options: { columns: 2 } },
    { name: 'stats', title: 'Kennzahlen', options: { columns: 2 } },
  ],
  fields: [
    // --- Group: basis ---
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
      group: 'basis',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      group: 'basis',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      type: 'reference',
      to: [{ type: 'client' }],
      title: 'Kunde / Eigentümer',
      group: 'basis',
    }),
    defineField({
      name: 'manager',
      type: 'array',
      title: 'Verwaltung / Ansprechpartner',
      description: 'Kontaktangaben oder Referenz zu einer Firma.',
      group: 'basis',
      of: [managerEntry],
      validation: (rule) => rule.max(1),
    }),
    defineField({
      name: 'pin',
      type: 'string',
      title: 'Zugangs-PIN (Chat)',
      description: '4-stellig, z.B. 1410. Wird für den Zugang zum Chat benötigt.',
      group: 'basis',
      validation: (Rule) => Rule.min(4).max(6).regex(/^\d+$/, { name: 'numbers' }),
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      title: 'Bild',
      group: 'basis',
      options: { hotspot: true },
    }),
    defineField({
      name: 'street',
      type: 'string',
      title: 'Strasse',
      group: 'basis',
      fieldset: 'address',
    }),
    defineField({
      name: 'zip',
      type: 'string',
      title: 'PLZ',
      group: 'basis',
      fieldset: 'address',
    }),
    defineField({
      name: 'city',
      type: 'string',
      title: 'Ort',
      group: 'basis',
      fieldset: 'address',
    }),
    defineField({
      name: 'country',
      type: 'string',
      title: 'Land',
      group: 'basis',
      fieldset: 'address',
      initialValue: 'Schweiz',
    }),
    // --- Group: structure ---
    defineField({
      name: 'floors',
      type: 'array',
      title: 'Stockwerke',
      group: 'structure',
      of: [defineArrayMember({ type: 'floor' })],
    }),
    defineField({
      name: 'zones',
      type: 'array',
      title: 'Zonen',
      group: 'structure',
      of: [defineArrayMember({ type: 'zone' })],
    }),
    // --- Group: dna ---
    defineField({
      name: 'heatingType',
      type: 'string',
      title: 'Heizung',
      group: 'dna',
      fieldset: 'systems',
      options: { list: heatingTypeOptions },
    }),
    defineField({
      name: 'waterSupply',
      type: 'string',
      title: 'Wasserversorgung',
      group: 'dna',
      fieldset: 'systems',
    }),
    defineField({
      name: 'ventilationType',
      type: 'string',
      title: 'Lüftung',
      group: 'dna',
      fieldset: 'systems',
    }),
    defineField({
      name: 'constructionYear',
      type: 'number',
      title: 'Baujahr',
      group: 'dna',
      fieldset: 'stats',
    }),
    defineField({
      name: 'lastRenovation',
      type: 'number',
      title: 'Letzte Sanierung (Jahr)',
      group: 'dna',
      fieldset: 'stats',
    }),
    defineField({
      name: 'floorsCount',
      type: 'number',
      title: 'Anzahl Etagen',
      group: 'dna',
      fieldset: 'stats',
    }),
    defineField({
      name: 'unitsCount',
      type: 'number',
      title: 'Anzahl Einheiten',
      group: 'dna',
      fieldset: 'stats',
    }),
    defineField({
      name: 'riskNotes',
      type: 'text',
      title: 'Risiko-Notizen',
      description: 'Bekannte Schwachstellen für die KI-Kontextualisierung.',
      group: 'dna',
      rows: 4,
    }),
    // --- Group: docs ---
    defineField({
      name: 'certificates',
      type: 'array',
      title: 'Zertifikate',
      group: 'docs',
      of: [defineArrayMember({ type: 'buildingCertificate' })],
    }),
    defineField({
      name: 'staticDocs',
      type: 'array',
      title: 'Statische Dokumente',
      description: 'Pläne, Verträge, allgemeine Unterlagen.',
      group: 'docs',
      of: [
        defineArrayMember({
          type: 'file',
          options: { accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg' },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      name: 'name',
      street: 'street',
      zip: 'zip',
      city: 'city',
      country: 'country',
      mainImage: 'mainImage',
    },
    prepare({ name, street, zip, city, country, mainImage }) {
      const zipCity = [zip, city].filter(Boolean).join(' ')
      const subtitle = [street, zipCity, country].filter(Boolean).join(', ')
      return {
        title: name || 'Unbenannt',
        subtitle: subtitle || undefined,
        media: mainImage || HomeIcon,
      }
    },
  },
})
