import { BlockElementIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const buildingSection = defineType({
  name: 'buildingSection',
  title: 'Gebäudeteil',
  type: 'document',
  icon: BlockElementIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'parentProperty',
      type: 'reference',
      to: [{ type: 'property' }],
      title: 'Parent Property',
    }),
  ],
  preview: {
    select: { name: 'name', propertyName: 'parentProperty.name' },
    prepare({ name, propertyName }) {
      return {
        title: name,
        subtitle: propertyName,
      }
    },
  },
})
