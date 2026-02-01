import { UsersIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const client = defineType({
  name: 'client',
  title: 'Firma',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'name' },
    }),
    defineField({
      name: 'logo',
      type: 'image',
      title: 'Logo',
    }),
    defineField({
      name: 'primaryColor',
      type: 'string',
      title: 'Primary Color',
      description: 'Hex color, e.g. #FF5733',
    }),
  ],
  preview: {
    select: { name: 'name', slug: 'slug.current' },
    prepare({ name, slug }) {
      return {
        title: name,
        subtitle: slug || undefined,
      }
    },
  },
})
