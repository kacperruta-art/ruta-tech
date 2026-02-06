import { defineType, defineField } from 'sanity'
import { ClipboardList } from 'lucide-react'

const statusOptions = [
  { title: 'Neu', value: 'new' },
  { title: 'Analyse', value: 'analyzing' },
  { title: 'Offen', value: 'open' },
  { title: 'Zugewiesen', value: 'assigned' },
  { title: 'In Bearbeitung', value: 'in_progress' },
  { title: 'Erledigt', value: 'resolved' },
  { title: 'Geschlossen', value: 'closed' },
]

const priorityOptions = [
  { title: 'Tief', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'Hoch', value: 'high' },
  { title: 'Kritisch', value: 'critical' },
]

export const ticket = defineType({
  name: 'ticket',
  title: 'Ticket',
  type: 'document',
  icon: ClipboardList,
  groups: [
    { name: 'meta', title: 'Meta', default: true },
    { name: 'context', title: 'Kontext' },
    { name: 'workflow', title: 'Workflow' },
    { name: 'resolution', title: 'Abschluss' },
  ],
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),

    // --- Group: meta ---
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'meta',
      options: { list: statusOptions },
      initialValue: 'new',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'priority',
      title: 'Priorität',
      type: 'string',
      group: 'meta',
      options: { list: priorityOptions },
      initialValue: 'normal',
    }),
    defineField({
      name: 'subject',
      title: 'Betreff',
      type: 'string',
      group: 'meta',
      description: 'KI-generiert oder manuell.',
      validation: (rule) => rule.required(),
    }),

    // --- Group: context ---
    defineField({
      name: 'locationContext',
      title: 'Standort-Kontext',
      type: 'object',
      group: 'context',
      description: 'Snapshot des Standorts zum Zeitpunkt der Erstellung.',
      fields: [
        defineField({ name: 'buildingName', title: 'Gebäude', type: 'string' }),
        defineField({ name: 'floorTitle', title: 'Stockwerk', type: 'string' }),
        defineField({ name: 'unitName', title: 'Einheit', type: 'string' }),
        defineField({ name: 'assetName', title: 'Anlage', type: 'string' }),
        defineField({
          name: 'assetRef',
          title: 'Anlage (Referenz)',
          type: 'reference',
          to: [{ type: 'asset' }],
        }),
      ],
    }),
    defineField({
      name: 'requestedBy',
      title: 'Gemeldet von',
      type: 'object',
      group: 'context',
      fields: [
        defineField({
          name: 'user',
          title: 'Benutzer',
          type: 'reference',
          to: [{ type: 'user' }],
        }),
        defineField({ name: 'unitName', title: 'Einheit', type: 'string' }),
        defineField({ name: 'channel', title: 'Kanal', type: 'string' }),
      ],
    }),

    // --- Group: workflow ---
    defineField({
      name: 'assignedTo',
      title: 'Zugewiesen an',
      type: 'reference',
      group: 'workflow',
      to: [{ type: 'provider' }],
    }),

    // --- Group: resolution (Enterprise) ---
    defineField({
      name: 'resolutionData',
      title: 'Abschluss-Daten',
      type: 'object',
      group: 'resolution',
      fields: [
        defineField({
          name: 'completionNote',
          title: 'Abschluss-Kommentar',
          type: 'text',
          rows: 4,
        }),
        defineField({
          name: 'proofOfWork',
          title: 'Nachweis (Foto)',
          type: 'image',
          description: 'Pflicht bei Status "Erledigt".',
          options: { hotspot: true },
        }),
        defineField({
          name: 'partsReplaced',
          title: 'Ersetzte Teile',
          type: 'array',
          of: [{ type: 'string' }],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'subject', status: 'status', priority: 'priority' },
    prepare({ title, status, priority }) {
      const emoji =
        priority === 'critical'
          ? '🔴'
          : priority === 'high'
            ? '🟠'
            : priority === 'normal'
              ? '🟡'
              : '⚪'
      return {
        title: `${emoji} ${title || 'Ohne Betreff'}`,
        subtitle: status ?? '',
      }
    },
  },
})
