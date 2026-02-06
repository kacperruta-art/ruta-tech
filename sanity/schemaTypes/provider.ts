import { defineType, defineField } from 'sanity'
import { Wrench } from 'lucide-react'

const tradeOptions = [
  { title: 'HLKS (Heizung/Lüftung/Klima/Sanitär)', value: 'hvac' },
  { title: 'Elektro', value: 'electrician' },
  { title: 'Facility Management', value: 'facility' },
  { title: 'Aufzug', value: 'lift' },
  { title: 'Reinigung', value: 'cleaning' },
  { title: 'Sicherheit', value: 'security' },
  { title: 'Verwaltung', value: 'management' },
]

export const provider = defineType({
  name: 'provider',
  title: 'Dienstleister',
  type: 'document',
  icon: Wrench,
  fields: [
    // --- Identity ---
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'companyName',
      title: 'Firmenname',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'uid',
      title: 'UID (MWST-Nr.)',
      type: 'string',
      description: 'z.B. CHE-123.456.789',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),

    // --- Service ---
    defineField({
      name: 'primaryTrade',
      title: 'Hauptgewerk',
      type: 'string',
      options: { list: tradeOptions },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags / Fachgebiete',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // --- Dispatch ---
    defineField({
      name: 'dispatchEmail',
      title: 'Auftrags-E-Mail',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'dispatchChannel',
      title: 'Versandkanal',
      type: 'string',
      options: {
        list: [
          { title: 'Magic Link', value: 'magic_link' },
          { title: 'Nur PDF', value: 'pdf_only' },
        ],
      },
      initialValue: 'magic_link',
    }),
    defineField({
      name: 'language',
      title: 'Bevorzugte Sprache',
      type: 'string',
      options: {
        list: [
          { title: 'Deutsch', value: 'de' },
          { title: 'Französisch', value: 'fr' },
          { title: 'Italienisch', value: 'it' },
          { title: 'Englisch', value: 'en' },
        ],
      },
      initialValue: 'de',
    }),

    // --- Emergency ---
    defineField({
      name: 'emergencyPhone',
      title: 'Notfall-Telefon',
      type: 'string',
      description: 'Optional. Wird bei kritischen Tickets angezeigt.',
    }),
  ],
  preview: {
    select: { title: 'companyName', subtitle: 'primaryTrade' },
  },
})
