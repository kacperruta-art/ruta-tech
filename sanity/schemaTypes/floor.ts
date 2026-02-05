import { StackIcon } from '@sanity/icons'
import { defineType, defineField } from 'sanity'
import { HierarchyBreadcrumbs } from '../components/HierarchyBreadcrumbs'

export const floor = defineType({
  name: 'floor',
  title: 'Etage',
  type: 'document',
  icon: StackIcon,
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
      name: 'level',
      title: 'Etagen-Nummer (Logik)',
      type: 'number',
      description:
        'z.B. -1 für Keller, 0 für EG, 1 für 1. Stock. Wichtig für die Sortierung.',
      initialValue: 0,
    }),
    defineField({
      name: 'building',
      title: 'Gehört zu Gebäude',
      type: 'reference',
      to: [{ type: 'building' }],
      readOnly: true,
    }),
    defineField({
      name: 'description',
      title: 'Beschreibung (Intern)',
      type: 'text',
      rows: 3,
      description: 'Zusätzliche Infos für das AI-System (z.B. "Hauptzugang zur Technik")',
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
    defineField({
      name: 'gebaeudeteil',
      title: 'Gebäudeteil (Bereich)',
      type: 'string',
      description: 'z.B. Waschraum, Technikraum, Allgemein',
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
