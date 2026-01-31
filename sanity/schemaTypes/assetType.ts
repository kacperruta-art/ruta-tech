import { TagIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const assetType = defineType({
  name: 'assetType',
  title: 'Asset Type',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Device Type Name',
    }),
    defineField({
      name: 'instructions',
      type: 'text',
      title: 'Maintenance Instructions',
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
})
