import { CubeIcon } from '@sanity/icons'
import { defineType, defineField, defineArrayMember } from 'sanity'

const serviceHistoryEntry = defineArrayMember({
  type: 'object',
  name: 'serviceHistoryEntry',
  fields: [
    defineField({
      name: 'date',
      type: 'date',
      title: 'Date',
      validation: (rule) => rule.required(),
      initialValue: () => new Date().toISOString().split('T')[0],
    }),
    defineField({
      name: 'type',
      type: 'string',
      title: 'Type',
      options: {
        list: [
          { title: 'Maintenance', value: 'Maintenance' },
          { title: 'Repair', value: 'Repair' },
          { title: 'Inspection', value: 'Inspection' },
          { title: 'Installation', value: 'Installation' },
        ],
      },
    }),
    defineField({
      name: 'technician',
      type: 'string',
      title: 'Technician',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Description',
    }),
    defineField({
      name: 'notes',
      type: 'text',
      title: 'Notes',
      hidden: true,
    }),
  ],
  preview: {
    select: { date: 'date', type: 'type', description: 'description' },
    prepare({ date, type, description }) {
      return {
        title: [date, type].filter(Boolean).join(' – '),
        subtitle: description ? description.slice(0, 50) + (description.length > 50 ? '…' : '') : undefined,
      }
    },
  },
})

export const asset = defineType({
  name: 'asset',
  title: 'Asset',
  type: 'document',
  icon: CubeIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'serialNumber',
      type: 'string',
      title: 'Serial Number',
    }),
    defineField({
      name: 'publicId',
      type: 'slug',
      title: 'QR Code ID',
      options: {
        source: 'name',
      },
    }),
    defineField({
      name: 'type',
      type: 'reference',
      to: [{ type: 'assetType' }],
      title: 'Type',
    }),
    defineField({
      name: 'location',
      type: 'reference',
      to: [{ type: 'unit' }],
      title: 'Location',
    }),
    defineField({
      name: 'serviceHistory',
      type: 'array',
      title: 'Service Log',
      of: [serviceHistoryEntry],
    }),
    defineField({
      name: 'localManuals',
      type: 'array',
      title: 'Local Manuals (Asset-Specific Override)',
      of: [
        defineArrayMember({
          type: 'file',
          options: { accept: '.pdf,.txt,.html' },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      name: 'name',
      unitName: 'location.name',
      typeName: 'type.name',
    },
    prepare({ name, unitName, typeName }) {
      return {
        title: name,
        subtitle: [unitName, typeName].filter(Boolean).join(' • ') || undefined,
      }
    },
  },
})
