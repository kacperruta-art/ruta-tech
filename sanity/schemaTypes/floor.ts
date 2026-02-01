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
      name: 'parentSection',
      type: 'reference',
      to: [{ type: 'buildingSection' }],
      title: 'Parent Section',
    }),
  ],
  preview: {
    select: { name: 'name', sectionName: 'parentSection.name' },
    prepare({ name, sectionName }) {
      return {
        title: name,
        subtitle: sectionName,
      }
    },
  },
})
