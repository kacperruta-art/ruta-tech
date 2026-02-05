import {
  ComponentIcon,
  PinIcon,
  CodeIcon as BarcodeIcon,
  CalendarIcon,
  CheckmarkCircleIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import { defineType, defineField, defineArrayMember } from 'sanity'
import { HierarchyBreadcrumbs } from '../components/HierarchyBreadcrumbs'

const assetTypeOptions = [
  { title: 'Heizung', value: 'Heating' },
  { title: 'Lüftung', value: 'Ventilation' },
  { title: 'Sanitär', value: 'Sanitary' },
  { title: 'Aufzug', value: 'Elevator' },
  { title: 'Elektro', value: 'Electrical' },
  { title: 'Waschraum-Gerät', value: 'Appliance' },
  { title: 'Türen / Tore', value: 'DoorGate' },
  { title: 'Sicherheit', value: 'Safety' },
  { title: 'Sonstiges', value: 'Other' },
]

const statusOptions = [
  { title: 'Aktiv', value: 'active' },
  { title: 'Wartung', value: 'maintenance' },
  { title: 'Defekt', value: 'defect' },
  { title: 'Inaktiv', value: 'inactive' },
]

export const asset = defineType({
  name: 'asset',
  title: 'Anlage / Gerät',
  type: 'document',
  icon: ComponentIcon,
  groups: [
    { name: 'basis', title: 'Basisdaten', default: true, icon: BarcodeIcon },
    { name: 'location', title: 'Standort', icon: PinIcon },
    { name: 'tech', title: 'Technik & Specs', icon: ComponentIcon },
    { name: 'service', title: 'Service & Garantie', icon: CalendarIcon },
    { name: 'docs', title: 'Dokumente', icon: CheckmarkCircleIcon },
    { name: 'legacy', title: 'Legacy', icon: WarningOutlineIcon, hidden: true },
  ],
  fieldsets: [
    { name: 'techDetails', title: 'Technische Daten', options: { columns: 2 } },
  ],
  fields: [
    defineField({
      name: 'locationContext',
      title: 'Navigation',
      type: 'string',
      group: 'basis',
      hidden: false,
      components: {
        input: HierarchyBreadcrumbs,
      },
      initialValue: 'Navigation',
    }),
    // --- Group: basis ---
    defineField({
      name: 'name',
      type: 'string',
      title: 'Bezeichnung',
      group: 'basis',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      group: 'basis',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'assetType',
      type: 'string',
      title: 'Kategorie',
      group: 'basis',
      options: { list: assetTypeOptions },
    }),
    defineField({
      name: 'status',
      type: 'string',
      title: 'Status',
      group: 'basis',
      options: { list: statusOptions },
      initialValue: 'active',
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      title: 'Titelbild',
      group: 'basis',
      options: { hotspot: true },
    }),
    // --- Group: location ---
    defineField({
      name: 'building',
      type: 'reference',
      to: [{ type: 'building' }],
      title: 'Gebäude',
      group: 'location',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parentFloor',
      type: 'reference',
      to: [{ type: 'floor' }],
      title: 'Ebene / Etage',
      description: 'Optional. Wähle eine Ebene (z.B. 1. OG).',
      group: 'location',
    }),
    defineField({
      name: 'parentUnit',
      type: 'reference',
      to: [{ type: 'unit' }],
      title: 'Raum / Einheit',
      description: 'Optional. Wähle einen Raum (z.B. Wohnung 2.1).',
      group: 'location',
    }),
    defineField({
      name: 'locationName',
      type: 'string',
      title: 'Gebäudeteil / Standort (Legacy)',
      description:
        "Name of the section defined in the Building (e.g. 'Waschküche A').",
      group: 'legacy',
      readOnly: true,
    }),
    defineField({
      name: 'coordinates',
      type: 'string',
      title: 'Koordinaten / Etage genau',
      group: 'location',
    }),
    // --- Group: tech ---
    defineField({
      name: 'manufacturer',
      type: 'string',
      title: 'Hersteller',
      group: 'tech',
      fieldset: 'techDetails',
    }),
    defineField({
      name: 'model',
      type: 'string',
      title: 'Modell / Typ',
      group: 'tech',
      fieldset: 'techDetails',
    }),
    defineField({
      name: 'serialNumber',
      type: 'string',
      title: 'Seriennummer',
      group: 'tech',
      fieldset: 'techDetails',
    }),
    defineField({
      name: 'installDate',
      type: 'date',
      title: 'Installationsdatum',
      group: 'tech',
      fieldset: 'techDetails',
    }),
    // --- Group: service ---
    defineField({
      name: 'serviceProviderName',
      type: 'string',
      title: 'Service Partner Name',
      group: 'service',
    }),
    defineField({
      name: 'serviceProviderContact',
      type: 'string',
      title: 'Telefon / E-Mail',
      group: 'service',
    }),
    defineField({
      name: 'warrantyUntil',
      type: 'date',
      title: 'Garantie bis',
      group: 'service',
    }),
    defineField({
      name: 'lastService',
      type: 'date',
      title: 'Letzter Service',
      group: 'service',
    }),
    defineField({
      name: 'nextService',
      type: 'date',
      title: 'Nächster Service',
      group: 'service',
    }),
    // --- Group: docs ---
    defineField({
      name: 'documents',
      type: 'array',
      title: 'Dokumente',
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
      assetType: 'assetType',
      buildingName: 'building.name',
      status: 'status',
      mainImage: 'mainImage',
    },
    prepare({ name, assetType, buildingName, status, mainImage }) {
      const subtitle = buildingName
        ? `${assetType || 'Asset'} | ${buildingName}`
        : assetType || undefined
      const media =
        mainImage || (status === 'defect' ? WarningOutlineIcon : ComponentIcon)
      return {
        title: name,
        subtitle,
        media,
      }
    },
  },
})
