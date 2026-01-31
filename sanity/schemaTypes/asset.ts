import { CubeIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const asset = defineType({
  name: 'asset',
  title: 'Asset',
  type: 'document',
  icon: CubeIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Device Specific Name/Location',
    }),
    defineField({
      name: 'publicId',
      type: 'slug',
      title: 'QR Code ID',
      options: {
        source: 'title',
      },
    }),
    defineField({
      name: 'building',
      type: 'reference',
      to: [{ type: 'building' }],
    }),
    defineField({
      name: 'assetType',
      type: 'reference',
      to: [{ type: 'assetType' }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      buildingTitle: 'building.title',
      typeTitle: 'assetType.title',
    },
    prepare({ title, buildingTitle, typeTitle }) {
      return {
        title,
        subtitle: [buildingTitle, typeTitle].filter(Boolean).join(' • ') || undefined,
      }
    },
  },
})
