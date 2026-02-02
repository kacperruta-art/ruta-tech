import {
  HomeIcon,
  ControlsIcon,
  ImagesIcon,
  InfoOutlineIcon as infoIcon,
  ThListIcon,
  DocumentIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import { defineType, defineField, defineArrayMember } from 'sanity'

const buildingSectionTypeOptions = [
  { title: 'Eingang', value: 'Entrance' },
  { title: 'Treppenhaus', value: 'Staircase' },
  { title: 'Etage', value: 'Floor' },
  { title: 'Liftschacht', value: 'ElevatorShaft' },
  { title: 'Waschküche', value: 'Laundry' },
  { title: 'Technikraum', value: 'TechnicalRoom' },
  { title: 'Garage', value: 'Garage' },
  { title: 'Aussenbereich', value: 'Outdoor' },
  { title: 'Gemeinschaftsbereich', value: 'CommonArea' },
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

const buildingSectionTypeTitles = typeTitleMap(buildingSectionTypeOptions)

export const buildingSection = defineType({
  name: 'buildingSection',
  title: 'Gebäudeteil',
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
      title: 'Typ',
      options: { list: buildingSectionTypeOptions },
    }),
    defineField({
      name: 'floor',
      type: 'string',
      title: 'Etage / Ebene',
    }),
    defineField({
      name: 'accessInfo',
      type: 'text',
      title: 'Zugang / Hinweise',
      rows: 3,
    }),
    defineField({
      name: 'qrEnabled',
      type: 'boolean',
      title: 'QR aktiviert',
      initialValue: true,
    }),
  ],
  preview: {
    select: { name: 'name', type: 'type' },
    prepare({ name, type }) {
      return {
        title: name || 'Unbenannt',
        subtitle: type ? buildingSectionTypeTitles.get(type) : undefined,
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
    { name: 'basis', title: 'Basisdaten', default: true, icon: infoIcon },
    { name: 'dna', title: 'Technisches DNA', icon: ControlsIcon },
    { name: 'structure', title: 'Gebäudeteile', icon: ThListIcon },
    { name: 'compliance', title: 'Dokumente & Zertifikate', icon: DocumentIcon },
    { name: 'dashboard', title: 'Dashboard', icon: WarningOutlineIcon },
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
      of: [
        defineArrayMember({ type: 'string', title: 'Kontaktangaben' }),
        defineArrayMember({ type: 'reference', to: [{ type: 'client' }], title: 'Firma' }),
      ],
      validation: (rule) => rule.max(1),
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      title: 'Titelbild',
      group: 'basis',
      icon: ImagesIcon,
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
      name: 'floors',
      type: 'number',
      title: 'Anzahl Etagen',
      group: 'dna',
      fieldset: 'stats',
    }),
    defineField({
      name: 'units',
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
    // --- Group: structure ---
    defineField({
      name: 'locations',
      type: 'array',
      title: 'Gebäudeteile / Locations',
      description: 'Physisches Layout, z.B. Waschküche A oder Tiefgarage -1.',
      group: 'structure',
      of: [defineArrayMember({ type: 'buildingSection' })],
    }),
    // --- Group: compliance ---
    defineField({
      name: 'certificates',
      type: 'array',
      title: 'Zertifikate',
      group: 'compliance',
      of: [defineArrayMember({ type: 'buildingCertificate' })],
    }),
    defineField({
      name: 'staticDocs',
      type: 'array',
      title: 'Statische Dokumente',
      description: 'Pläne, Verträge, allgemeine Unterlagen.',
      group: 'compliance',
      of: [
        defineArrayMember({
          type: 'file',
          options: { accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg' },
        }),
      ],
    }),
    // --- Group: dashboard ---
    defineField({
      name: 'statusNote',
      type: 'string',
      title: 'Statushinweis',
      description: 'Manuelle Hinweise für das Dashboard (Live-Daten kommen aus Queries).',
      group: 'dashboard',
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
        media: mainImage,
      }
    },
  },
})
