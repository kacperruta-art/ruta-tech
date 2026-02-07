import { defineType, defineField } from 'sanity'
import { 
  Wrench,          // Repair
  Hammer,          // Maintenance
  ClipboardCheck,  // Inspection
  AlertTriangle,   // Emergency
  FileText,        // Note
  BookOpen         // Default Icon
} from 'lucide-react'

export const logbookEntry = defineType({
  name: 'logbookEntry',
  title: 'Logbuch-Eintrag', // German UI Title
  type: 'document',
  icon: BookOpen, 
  fields: [
    // 1. TENANT (Mandant)
    defineField({
      name: 'tenant',
      title: 'Mandant', 
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),

    // 2. POLYMORPHIC TARGET (Zielobjekt)
    defineField({
      name: 'target',
      title: 'Zielobjekt',
      type: 'reference',
      to: [
        { type: 'property' },        // Liegenschaft
        { type: 'building' },        // Gebäude
        { type: 'floor' },           // Etage
        { type: 'unit' },            // Einheit
        { type: 'parkingFacility' }, // Parkplatz
        { type: 'asset' },           // Anlage
      ],
      description: 'Das betroffene Objekt für die Historie auswählen.', // German description for user
      validation: (rule) => rule.required(),
    }),

    // 3. EVENT TYPE (Ereignistyp)
    defineField({
      name: 'type',
      title: 'Ereignistyp',
      type: 'string',
      options: {
        list: [
          { title: 'Reparatur', value: 'repair' },
          { title: 'Wartung', value: 'maintenance' },
          { title: 'Inspektion', value: 'inspection' },
          { title: 'Notfall', value: 'emergency' },
          { title: 'Notiz', value: 'note' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
      initialValue: 'note',
    }),

    // 4. STATUS
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Offen', value: 'open' },
          { title: 'In Arbeit', value: 'in_progress' },
          { title: 'Erledigt', value: 'done' },
        ],
        layout: 'radio',
      },
      initialValue: 'done',
    }),

    // 5. DATE (Datum)
    defineField({
      name: 'date',
      title: 'Datum',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),

    // 6. PROVIDER (Dienstleister)
    defineField({
      name: 'provider',
      title: 'Dienstleister',
      type: 'reference',
      to: [{ type: 'provider' }],
    }),

    // 7. COST (Kosten)
    defineField({
      name: 'cost',
      title: 'Kosten (CHF)',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),

    // 8. DESCRIPTION (Beschreibung)
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'text',
      rows: 3,
    }),

    // 9. DOCUMENTS (Dokumente)
    defineField({
      name: 'documents',
      title: 'Dokumente',
      type: 'array',
      of: [{ type: 'file' }, { type: 'image' }],
    }),
  ],

  // PREVIEW CONFIGURATION
  preview: {
    select: {
      title: 'type',
      subtitle: 'target.name',
      date: 'date',
    },
    prepare({ title, subtitle, date }) {
      // German labels for the UI
      const typeLabels: Record<string, string> = {
        repair: 'Reparatur',
        maintenance: 'Wartung',
        inspection: 'Inspektion',
        emergency: 'Notfall',
        note: 'Notiz',
      }

      // Icon mapping based on type
      const typeIcons: Record<string, any> = {
        repair: Wrench,
        maintenance: Hammer,
        inspection: ClipboardCheck,
        emergency: AlertTriangle,
        note: FileText,
      }

      const dateStr = date
        ? new Date(date).toLocaleDateString('de-CH')
        : ''

      return {
        title: typeLabels[title] || title,
        subtitle: `${dateStr} · ${subtitle || '-'}`,
        media: typeIcons[title] || FileText, // Dynamic icon rendering
      }
    },
  },
})