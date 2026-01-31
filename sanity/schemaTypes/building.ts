import { HomeIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const building = defineType({
  name: 'building',
  title: 'Building',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Building Name',
    }),
    defineField({
      name: 'pin',
      type: 'string',
      title: 'Access PIN',
    }),
  ],
})
