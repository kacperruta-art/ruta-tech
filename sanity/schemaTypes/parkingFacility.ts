import {defineType, defineField} from 'sanity'
import {Car, Zap, Lock, CircleParking, QrCode} from 'lucide-react'
import {QRCodeInput} from '../components/QRCodeInput'

// 1. PARKING SPOT (Child Document)
export const parkingSpot = defineType({
  name: 'parkingSpot',
  title: 'Parkplatz',
  type: 'document',
  icon: CircleParking,
  groups: [
    {name: 'core', title: 'Basisdaten', default: true},
    {name: 'rent', title: 'Vermietung', icon: Lock},
    {name: 'tech', title: 'Technik', icon: Zap},
    {name: 'identification', title: 'QR & ID', icon: QrCode},
  ],
  fields: [
    defineField({
      name: 'facility',
      title: 'Gehoert zu Parkanlage',
      type: 'reference',
      to: [{type: 'parkingFacility'}],
      group: 'core',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'number',
      title: 'Nummer',
      type: 'string',
      group: 'core',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'rent',
      options: {
        list: [
          {title: 'Vermietet', value: 'rented'},
          {title: 'Leer', value: 'vacant'},
          {title: 'Besucher', value: 'visitor'},
        ],
      },
      initialValue: 'vacant',
    }),
    defineField({
      name: 'tenant',
      title: 'Mieter',
      type: 'reference',
      to: [{type: 'user'}],
      group: 'rent',
      hidden: ({parent}) => parent?.status !== 'rented',
    }),
    defineField({
      name: 'isElectric',
      title: 'E-Ladestation',
      type: 'boolean',
      group: 'tech',
      initialValue: false,
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
    select: {number: 'number', status: 'status', facility: 'facility.name'},
    prepare({number, status, facility}) {
      const statusLabel = status === 'rented' ? 'Vermietet' : status === 'visitor' ? 'Besucher' : 'Leer'
      return {
        title: `PP ${number}`,
        subtitle: `${facility || ''} · ${statusLabel}`,
      }
    },
  },
})

// 2. PARKING FACILITY (Parent Document)
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
          {title: 'Tiefgarage', value: 'underground'},
          {title: 'Aussenparkplatz', value: 'outdoor'},
        ],
      },
    }),
    defineField({
      name: 'maxHeight',
      title: 'Max. Durchfahrtshoehe (m)',
      type: 'number',
    }),
  ],
  preview: {
    select: {title: 'name', type: 'type'},
    prepare({title, type}) {
      return {
        title: title,
        subtitle: type === 'underground' ? 'Tiefgarage' : 'Aussen',
        media: Car,
      }
    },
  },
})
