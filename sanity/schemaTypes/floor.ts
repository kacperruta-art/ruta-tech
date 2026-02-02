import { defineField, defineType } from 'sanity'
import { TiersIcon } from '@sanity/icons'

export const floor = defineType({
  name: 'floor',
  title: 'Ebene / Bereich',
  type: 'document',
  icon: TiersIcon,
  fields: [
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
          { title: 'Etage', value: 'floor' },
          { title: 'Untergeschoss / Keller', value: 'basement' },
          { title: 'Dach', value: 'roof' },
          { title: 'Aussenbereich', value: 'outdoor' },
          { title: 'Garage', value: 'garage' },
        ],
      },
    }),
    defineField({
      name: 'level',
      title: 'Etagen-Nummer',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'building',
      title: 'Gehört zu Gebäude',
      type: 'reference',
      to: [{ type: 'building' }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'type' },
  },
})
