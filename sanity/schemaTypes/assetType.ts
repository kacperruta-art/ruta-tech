import { TagIcon } from '@sanity/icons'
import { defineType, defineField, defineArrayMember } from 'sanity'

export const assetType = defineType({
  name: 'assetType',
  title: 'Asset Typ',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'maintenanceInstructions',
      type: 'array',
      title: 'Maintenance Knowledge Base',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'manuals',
      type: 'array',
      title: 'Official Manuals & Schematics',
      of: [
        defineArrayMember({
          type: 'file',
          options: { accept: '.pdf,.txt,.html' },
        }),
      ],
    }),
  ],
  preview: {
    select: { name: 'name' },
  },
})
