import { defineType, defineField } from 'sanity'
import { User } from 'lucide-react'

export const user = defineType({
  name: 'user',
  title: 'Benutzer',
  type: 'document',
  icon: User,
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),

    // --- Profile ---
    defineField({
      name: 'firstName',
      title: 'Vorname',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Nachname',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'E-Mail',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Telefon',
      type: 'string',
    }),
    defineField({
      name: 'avatar',
      title: 'Profilbild',
      type: 'image',
      options: { hotspot: true },
    }),

    // --- Settings ---
    defineField({
      name: 'language',
      title: 'Sprache',
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
    defineField({
      name: 'communicationChannel',
      title: 'Kommunikationskanal',
      type: 'string',
      options: {
        list: [
          { title: 'WhatsApp', value: 'whatsapp' },
          { title: 'E-Mail', value: 'email' },
        ],
      },
      initialValue: 'email',
    }),

    // --- Role ---
    defineField({
      name: 'systemRole',
      title: 'Systemrolle',
      type: 'string',
      options: {
        list: [
          { title: 'Mieter', value: 'tenant' },
          { title: 'Verwalter', value: 'manager' },
          { title: 'Dienstleister', value: 'provider' },
          { title: 'Administrator', value: 'admin' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { first: 'firstName', last: 'lastName', role: 'systemRole' },
    prepare({ first, last, role }) {
      return {
        title: [first, last].filter(Boolean).join(' ') || 'Unbenannt',
        subtitle: role,
      }
    },
  },
})
