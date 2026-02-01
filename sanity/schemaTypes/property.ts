import { HomeIcon } from '@sanity/icons'
import { defineType, defineField, defineArrayMember } from 'sanity'

export const property = defineType({
  name: 'property',
  title: 'Immobilie / Nieruchomość',
  type: 'document',
  icon: HomeIcon,
  fieldsets: [
    {
      name: 'address',
      title: 'Address Details',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'specs',
      title: 'Building Specifications',
      options: { collapsible: true },
    },
    {
      name: 'contact',
      title: 'Property Manager / Contact',
      options: { collapsible: true },
    },
  ],
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'owner',
      type: 'reference',
      to: [{ type: 'client' }],
      title: 'Owner',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'street',
      type: 'string',
      title: 'Street',
      fieldset: 'address',
    }),
    defineField({
      name: 'zipCode',
      type: 'string',
      title: 'ZIP Code',
      fieldset: 'address',
    }),
    defineField({
      name: 'city',
      type: 'string',
      title: 'City',
      fieldset: 'address',
    }),
    defineField({
      name: 'country',
      type: 'string',
      title: 'Country',
      fieldset: 'address',
      initialValue: 'Switzerland',
    }),
    defineField({
      name: 'constructionYear',
      type: 'number',
      title: 'Construction Year',
      fieldset: 'specs',
    }),
    defineField({
      name: 'propertyType',
      type: 'string',
      title: 'Property Type',
      fieldset: 'specs',
      options: {
        list: [
          { title: 'Residential', value: 'Residential' },
          { title: 'Commercial', value: 'Commercial' },
          { title: 'Industrial', value: 'Industrial' },
          { title: 'Mixed Use', value: 'Mixed Use' },
        ],
      },
    }),
    defineField({
      name: 'totalArea',
      type: 'number',
      title: 'Total Area (sqm)',
      fieldset: 'specs',
    }),
    defineField({
      name: 'managerName',
      type: 'string',
      title: 'Manager Name',
      fieldset: 'contact',
    }),
    defineField({
      name: 'managerPhone',
      type: 'string',
      title: 'Manager Phone',
      fieldset: 'contact',
    }),
    defineField({
      name: 'managerEmail',
      type: 'string',
      title: 'Manager Email',
      fieldset: 'contact',
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      title: 'Photo Gallery',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
        }),
      ],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'pin',
      type: 'string',
      title: 'Access PIN',
    }),
  ],
  preview: {
    select: { name: 'name', city: 'city', street: 'street' },
    prepare({ name, city, street }) {
      const subtitle = [city, street].filter(Boolean).join(', ')
      return {
        title: name,
        subtitle: subtitle || undefined,
      }
    },
  },
})
