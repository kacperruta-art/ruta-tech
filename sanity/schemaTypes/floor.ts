import { StackIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const floor = defineType({
  name: 'floor',
  title: 'Etage',
  type: 'document',
  icon: StackIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'parentBuilding',
      type: 'reference',
      to: [{ type: 'building' }],
      title: 'Gebäude',
    }),
    defineField({
      name: 'parentSection',
      type: 'string',
      title: 'Gebäudeteil',
    }),
    defineField({
      name: 'Gebäudeteil',
      title: 'Gebäudeteil (Bereich)',
      type: 'string',
      description: 'z.B. Waschraum, Technikraum, Allgemein',
    }),
  ],
  preview: {
    select: { name: 'name', buildingName: 'parentBuilding.name', sectionName: 'parentSection' },
    prepare({ name, buildingName, sectionName }) {
      return {
        title: name,
        subtitle: [buildingName, sectionName].filter(Boolean).join(' • ') || undefined,
      }
    },
  },
})
