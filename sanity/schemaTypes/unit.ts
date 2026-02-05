import { DocumentIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'
import { HierarchyBreadcrumbs } from '../components/HierarchyBreadcrumbs'

export const unit = defineType({
  name: 'unit',
  title: 'Wohnung',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'locationContext',
      title: ' ',
      type: 'string',
      hidden: false,
      components: {
        input: HierarchyBreadcrumbs,
      },
      initialValue: 'Navigation',
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tenantName',
      type: 'string',
      title: 'Tenant Name',
    }),
    defineField({
      name: 'building',
      title: 'Gehört zu Gebäude',
      type: 'reference',
      to: [{ type: 'building' }],
      readOnly: true,
      hidden: false,
    }),
    defineField({
      name: 'floor',
      title: 'Gehört zu Ebene',
      type: 'reference',
      to: [{ type: 'floor' }],
      readOnly: true,
      hidden: false,
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
