import { UsersIcon, HomeIcon, DocumentIcon, TagIcon } from '@sanity/icons'
import { defineType, defineField, defineArrayMember } from 'sanity'

const keyContactMember = defineArrayMember({
  type: 'object',
  name: 'keyContact',
  title: 'Kontaktperson / Handwerker',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Vorname & Nachname',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      type: 'string',
      title: 'Funktion / Gewerk',
      description: 'z.B. Hauswart, Sanitär, Elektro – wird für die KI-Zuordnung genutzt',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'phone',
      type: 'string',
      title: 'Direktdurchwahl / Mobil',
    }),
    defineField({
      name: 'email',
      type: 'string',
      title: 'E-Mail',
    }),
  ],
  preview: {
    select: { name: 'name', role: 'role' },
    prepare({ name, role }) {
      return {
        title: name || 'Unbenannt',
        subtitle: role || undefined,
      }
    },
  },
})

const documentItemMember = defineArrayMember({
  type: 'object',
  name: 'documentItem',
  title: 'Eintrag',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Bezeichnung',
    }),
    defineField({
      name: 'file',
      type: 'file',
      title: 'Datei',
      options: {
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
      },
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Unbenannt',
      }
    },
  },
})

export const client = defineType({
  name: 'client',
  title: 'Firma',
  type: 'document',
  icon: TagIcon,
  groups: [
    { name: 'details', title: 'Basisdaten & Branding', default: true, icon: TagIcon },
    { name: 'contact', title: 'Adresse & Kontakt', icon: HomeIcon },
    { name: 'team', title: 'Zuständigkeiten & Team', icon: UsersIcon },
    { name: 'docs', title: 'Dokumente', icon: DocumentIcon },
  ],
  fieldsets: [
    {
      name: 'branding',
      title: 'Branding',
      options: { columns: 2 },
    },
    {
      name: 'location',
      title: 'Standort',
      options: { columns: 2 },
    },
    {
      name: 'communication',
      title: 'Kommunikation',
      options: { columns: 2 },
    },
  ],
  fields: [
    // --- Group: details ---
    defineField({
      name: 'name',
      type: 'string',
      title: 'Firmenname',
      group: 'details',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      group: 'details',
      options: { source: 'name' },
    }),
    defineField({
      name: 'logo',
      type: 'image',
      title: 'Logo',
      group: 'details',
      fieldset: 'branding',
    }),
    defineField({
      name: 'primaryColor',
      type: 'string',
      title: 'Hauptfarbe (Hex)',
      description: 'z.B. #0066aa',
      group: 'details',
      fieldset: 'branding',
      validation: (rule) =>
        rule
          .regex(/^#[0-9A-Fa-f]{6}$/, { name: 'hexColor', invert: false })
          .error('Bitte Hex-Code im Format #RRGGBB angeben'),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Beschreibung / Tätigkeit',
      rows: 4,
      group: 'details',
    }),
    // --- Group: contact ---
    defineField({
      name: 'address',
      type: 'text',
      title: 'Adresse',
      rows: 3,
      group: 'contact',
    }),
    defineField({
      name: 'zipCity',
      type: 'string',
      title: 'PLZ & Ort',
      group: 'contact',
      fieldset: 'location',
    }),
    defineField({
      name: 'country',
      type: 'string',
      title: 'Land',
      group: 'contact',
      fieldset: 'location',
    }),
    defineField({
      name: 'email',
      type: 'string',
      title: 'Allgemeine E-Mail',
      group: 'contact',
      fieldset: 'communication',
    }),
    defineField({
      name: 'phone',
      type: 'string',
      title: 'Hauptnummer',
      group: 'contact',
      fieldset: 'communication',
    }),
    defineField({
      name: 'website',
      type: 'url',
      title: 'Webseite',
      group: 'contact',
    }),
    defineField({
      name: 'uid',
      type: 'string',
      title: 'UID-Nummer',
      description: 'z.B. CHE-123.456.789',
      group: 'contact',
      validation: (rule) =>
        rule
          .regex(/^CHE-\d{3}\.\d{3}\.\d{3}$/, { name: 'swissUid', invert: false })
          .error('Bitte UID im Format CHE-123.456.789 angeben'),
    }),
    // --- Group: team ---
    defineField({
      name: 'keyContacts',
      type: 'array',
      title: 'Kontaktpersonen / Handwerker',
      description: 'Zuständige Personen und Gewerke – die KI nutzt diese Angaben für die Zuordnung.',
      group: 'team',
      of: [keyContactMember],
    }),
    // --- Group: docs ---
    defineField({
      name: 'documents',
      type: 'array',
      title: 'Zertifikate & Unterlagen',
      group: 'docs',
      of: [documentItemMember],
    }),
  ],
  preview: {
    select: {
      name: 'name',
      slug: 'slug.current',
      logo: 'logo',
    },
    prepare({ name, slug, logo }) {
      const url = slug ? `https://ruta.tech/${slug}` : 'https://ruta.tech'
      return {
        title: name || 'Unbenannt',
        subtitle: url,
        media: logo,
      }
    },
  },
})
