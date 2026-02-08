import {defineType, defineField} from 'sanity'
import {Trees, QrCode} from 'lucide-react'
import {QRCodeInput} from '../components/QRCodeInput'

export const outdoorArea = defineType({
  name: 'outdoorArea',
  title: 'Aussenanlage',
  type: 'document',
  icon: Trees,
  groups: [
    {name: 'identification', title: 'QR & ID', icon: QrCode},
  ],
  fields: [
    // Context
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{type: 'tenant'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'property',
      title: 'Liegenschaft',
      type: 'reference',
      to: [{type: 'property'}],
      validation: (rule) => rule.required(),
    }),

    // Details
    defineField({
      name: 'name',
      title: 'Bezeichnung',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          {title: 'Garten / Grünfläche', value: 'garden'},
          {title: 'Spielplatz', value: 'playground'},
          {title: 'Hartplatz / Wege', value: 'hardscape'},
          {title: 'Entsorgungsstelle', value: 'waste_area'},
          {title: 'Sonstiges', value: 'other'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'areaSize',
      title: 'Fläche (m²)',
      type: 'number',
    }),
    defineField({
      name: 'image',
      title: 'Bild',
      type: 'image',
      options: {hotspot: true},
    }),

    // === QR & Identification ===
    defineField({
      name: 'qrCodeGenerator',
      title: 'QR-Code Etikette',
      type: 'string',
      components: {input: QRCodeInput},
      group: 'identification',
      readOnly: true,
    }),
  ],
  preview: {
    select: {title: 'name', type: 'type', property: 'property.name'},
    prepare({title, type, property}) {
      const typeLabels: Record<string, string> = {
        garden: 'Grünfläche',
        playground: 'Spielplatz',
        hardscape: 'Wege/Platz',
        waste_area: 'Entsorgung',
        other: 'Sonstiges',
      }
      return {
        title: title,
        subtitle: `${typeLabels[type] || type} · ${property || ''}`,
      }
    },
  },
})
