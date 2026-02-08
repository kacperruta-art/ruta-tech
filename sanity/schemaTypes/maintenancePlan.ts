import {defineType, defineField, defineArrayMember} from 'sanity'
import {CalendarClock, ListChecks, ArrowRightCircle} from 'lucide-react'

export const maintenancePlan = defineType({
  name: 'maintenancePlan',
  title: 'Wartungsplan',
  type: 'document',
  icon: CalendarClock,
  groups: [
    {name: 'config', title: 'Konfiguration', default: true},
    {name: 'schedule', title: 'Intervall & Termin'},
    {name: 'tasks', title: 'Checkliste'},
  ],
  fields: [
    // --- 1. CONFIG ---
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{type: 'tenant'}],
      group: 'config',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Bezeichnung',
      type: 'string',
      group: 'config',
      description: 'z.B. "Jahreswartung Liftanlage"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'scope',
      title: 'Betroffenes Objekt',
      type: 'reference',
      group: 'config',
      description: 'Was muss gewartet werden?',
      to: [
        {type: 'asset'},
        {type: 'building'},
        {type: 'outdoorArea'},
        {type: 'parkingFacility'},
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Plan Aktiv',
      type: 'boolean',
      group: 'config',
      initialValue: true,
    }),

    // --- 2. SCHEDULE ---
    defineField({
      name: 'frequency',
      title: 'Intervall',
      type: 'string',
      group: 'schedule',
      options: {
        list: [
          {title: 'Monatlich', value: 'monthly'},
          {title: 'Vierteljährlich', value: 'quarterly'},
          {title: 'Halbjährlich', value: 'biannual'},
          {title: 'Jährlich', value: 'annual'},
          {title: 'Alle 2 Jahre', value: 'biennial'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Startdatum',
      type: 'date',
      group: 'schedule',
      description: 'Wann beginnt der Zyklus?',
    }),
    defineField({
      name: 'nextDueDate',
      title: 'Nächste Fälligkeit',
      type: 'date',
      group: 'schedule',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lastExecutionDate',
      title: 'Letzte Ausführung',
      type: 'date',
      group: 'schedule',
      description: 'Datum der letzten durchgeführten Wartung.',
    }),
    defineField({
      name: 'assignedProvider',
      title: 'Zuständiger Dienstleister',
      type: 'reference',
      group: 'schedule',
      to: [{type: 'provider'}],
      description: 'Wer führt die Wartung durch?',
    }),
    defineField({
      name: 'description',
      title: 'Beschreibung / Instruktionen',
      type: 'text',
      group: 'schedule',
      rows: 3,
      description: 'Hinweise für den Dienstleister oder interne Notizen.',
    }),

    // --- 3. TASKS ---
    defineField({
      name: 'checklist',
      title: 'Aufgaben / Checkliste',
      type: 'array',
      group: 'tasks',
      of: [
        defineArrayMember({
          type: 'object',
          icon: ListChecks,
          fields: [
            defineField({
              name: 'task',
              title: 'Aufgabe',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'isCritical',
              title: 'Kritisch?',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: {title: 'task', isCritical: 'isCritical'},
            prepare({title, isCritical}) {
              return {
                title: title,
                media: isCritical ? ArrowRightCircle : ListChecks,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      nextDate: 'nextDueDate',
      freq: 'frequency',
      isActive: 'isActive',
    },
    prepare({title, nextDate, freq, isActive}) {
      const freqMap: Record<string, string> = {
        monthly: 'Monatlich',
        quarterly: 'Vierteljährlich',
        biannual: 'Halbjährlich',
        annual: 'Jährlich',
        biennial: 'Alle 2 Jahre',
      }

      const dateStr = nextDate
        ? new Date(nextDate).toLocaleDateString('de-CH')
        : 'Kein Termin'

      const freqLabel = freqMap[freq] || freq || '?'
      const activePrefix = isActive === false ? '[INAKTIV] ' : ''

      return {
        title: `${activePrefix}${title || 'Ohne Titel'}`,
        subtitle: `${freqLabel} | Nächster: ${dateStr}`,
        media: CalendarClock,
      }
    },
  },
})
