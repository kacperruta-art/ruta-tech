import { defineType, defineField, defineArrayMember } from 'sanity'
import { Layers } from 'lucide-react'

export const floor = defineType({
  name: 'floor',
  title: 'Stockwerk / Ebene',
  type: 'document',
  icon: Layers,
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'building',
      title: 'Gebäude',
      type: 'reference',
      to: [{ type: 'building' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'levelNumber',
      title: 'Stockwerk-Nummer',
      type: 'number',
      description: 'z.B. -2, -1, 0 (EG), 1, 2 …',
      validation: (rule) => rule.required().integer().min(-10).max(200),
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Innenbereich', value: 'indoor' },
          { title: 'Aussenbereich', value: 'outdoor' },
          { title: 'Technikgeschoss', value: 'technical' },
          { title: 'Dach', value: 'roof' },
        ],
      },
    }),
    defineField({
      name: 'title',
      title: 'Bezeichnung',
      type: 'string',
      description: 'z.B. "Erdgeschoss", "1. OG", "Untergeschoss 2"',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'floorPlan',
      title: 'Grundriss',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'zones',
      title: 'Zonen',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'zoneEntry',
          title: 'Zone',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'type',
              title: 'Typ',
              type: 'string',
              options: {
                list: [
                  { title: 'Gemeinschaftsfläche', value: 'common' },
                  { title: 'Sanitärbereich', value: 'sanitary' },
                  { title: 'Erholungszone', value: 'recreation' },
                  { title: 'Entsorgung', value: 'waste' },
                ],
              },
            }),
            defineField({
              name: 'isPublic',
              title: 'Öffentlich zugänglich',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'type' },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', level: 'levelNumber', building: 'building.name' },
    prepare({ title, level, building }) {
      const label = title || (level !== undefined ? `Ebene ${level}` : 'Unbenannt')
      return {
        title: label,
        subtitle: building ?? '',
      }
    },
  },
})
