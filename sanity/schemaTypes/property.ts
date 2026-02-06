import { defineType, defineField } from 'sanity'
import { MapPin } from 'lucide-react'

export const property = defineType({
  name: 'property',
  title: 'Liegenschaft',
  type: 'document',
  icon: MapPin,
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'manager',
      title: 'Verantwortliche Person',
      type: 'reference',
      to: [{ type: 'user' }],
    }),
    defineField({
      name: 'globalServices',
      title: 'Globale Dienstleistungen',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'serviceName',
              title: 'Dienstleistung',
              type: 'string',
            }),
            defineField({
              name: 'description',
              title: 'Beschreibung',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: { title: 'serviceName' },
          },
        },
      ],
    }),
    defineField({
      name: 'geoBounds',
      title: 'Geo-Standort',
      type: 'geopoint',
    }),
  ],
  preview: {
    select: { title: 'name' },
  },
})
