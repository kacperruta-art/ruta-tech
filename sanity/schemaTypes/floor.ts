import { LayersIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

const floorTypeOptions = [
  { title: 'Etage', value: 'floor' },
  { title: 'Untergeschoss/Keller', value: 'basement' },
  { title: 'Dach', value: 'roof' },
  { title: 'Aussenbereich', value: 'outdoor' },
  { title: 'Garage', value: 'garage' },
]

export const floor = defineType({
  name: 'floor',
  title: 'Ebene / Bereich',
  type: 'document',
  icon: LayersIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Bezeichnung',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      type: 'string',
      title: 'Typ',
      options: {
        list: floorTypeOptions,
      },
    }),
    defineField({
      name: 'level',
      type: 'number',
      title: 'Etagen-Nummer',
    }),
    defineField({
      name: 'building',
      type: 'reference',
      title: 'Gehört zu Gebäude',
      to: [{ type: 'building' }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      name: 'name',
      type: 'type',
    },
    prepare({ name, type }) {
      return {
        title: name || 'Unbenannt',
        subtitle: type,
      }
    },
  },
})
import { StackIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'

export const floor = defineType({
  name: 'floor',
  title: 'Etage',
  type: 'document',
  icon: StackIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'parentBuilding',
      type: 'reference',
      to: [{ type: 'building' }],
      title: 'Gebäude',
    }),
    defineField({
      name: 'parentSection',
      type: 'string',
      title: 'Gebäudeteil',
    }),
  ],
  preview: {
    select: { name: 'name', buildingName: 'parentBuilding.name', sectionName: 'parentSection' },
    prepare({ name, buildingName, sectionName }) {
      return {
        title: name,
        subtitle: [buildingName, sectionName].filter(Boolean).join(' • ') || undefined,
      }
    },
  },
})
