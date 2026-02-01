import { DocumentIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const unit = defineType({
  name: 'unit',
  title: 'Wohnung',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'tenantName',
      type: 'string',
      title: 'Tenant Name',
    }),
    defineField({
      name: 'parentFloor',
      type: 'reference',
      to: [{ type: 'floor' }],
      title: 'Parent Floor',
    }),
  ],
  preview: {
    select: { name: 'name', tenantName: 'tenantName', floorName: 'parentFloor.name' },
    prepare({ name, tenantName, floorName }) {
      return {
        title: name,
        subtitle: [tenantName, floorName].filter(Boolean).join(' • ') || undefined,
      }
    },
  },
})
