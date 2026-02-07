import { defineType, defineField } from 'sanity'
import { ClipboardList, AlertCircle, CheckCircle2, Clock, XCircle, HelpCircle } from 'lucide-react'

// ── Status Definition (Clean B2B) ────────────────────────
const statusOptions = [
  { title: 'Warte auf Freigabe', value: 'pending_approval' },
  { title: 'Freigegeben / Beauftragt', value: 'approved' },
  { title: 'Abgelehnt', value: 'rejected' },
  { title: 'In Bearbeitung', value: 'in_progress' },
  { title: 'Abgeschlossen', value: 'completed' },
]

// ── Priority Definition ──────────────────────────────────
const priorityOptions = [
  { title: 'Niedrig', value: 'low' },
  { title: 'Mittel', value: 'medium' },
  { title: 'Hoch', value: 'high' },
  { title: 'Notfall (Sofort)', value: 'emergency' },
]

export const ticket = defineType({
  name: 'ticket',
  title: 'Ticket',
  type: 'document',
  icon: ClipboardList,
  groups: [
    { name: 'issue', title: 'Problem', default: true },
    { name: 'context', title: 'Kontext & Melder' }, // Najważniejsze dla automatyzacji
    { name: 'workflow', title: 'Workflow' },
    { name: 'resolution', title: 'Abschluss' },
  ],
  fields: [
    // 1. MANDANT (Multi-Tenancy)
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
      readOnly: true, // Zazwyczaj ustawiane automatycznie przez system
    }),

    // 2. PROBLEM (Co się stało?)
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      group: 'issue',
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'text',
      group: 'issue',
      rows: 4,
    }),
    defineField({
      name: 'priority',
      title: 'Priorität',
      type: 'string',
      group: 'issue',
      options: { list: priorityOptions, layout: 'radio' },
      initialValue: 'medium',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Fotos',
      type: 'array',
      group: 'issue',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),

    // 3. KONTEKST (Skąd przyszło zgłoszenie? - AUTOMATYZACJA)
    defineField({
      name: 'scope',
      title: 'Betroffenes Objekt',
      type: 'reference',
      group: 'context',
      description: 'Das Objekt (Wohnung, Gebäude, Asset), auf das sich das Ticket bezieht.',
      to: [
        { type: 'property' },
        { type: 'building' },
        { type: 'floor' },
        { type: 'unit' },
        { type: 'asset' },
        { type: 'outdoorArea' },
      ],
      validation: (rule) => rule.required(),
    }),
    
    // Kto zgłosił? (Automatycznie mapowane z sesji usera)
    defineField({
      name: 'reportedByUser',
      title: 'Gemeldet von (User)',
      type: 'reference',
      group: 'context',
      to: [{ type: 'user' }],
      description: 'Verknüpftes Benutzerkonto des Melders.',
    }),
    defineField({
      name: 'reportedByName',
      title: 'Name des Melders',
      type: 'string',
      group: 'context',
      description: 'Fallback, falls kein User-Account existiert.',
    }),
    defineField({
        name: 'contactInfo',
        title: 'Kontakt-Details',
        type: 'object',
        group: 'context',
        fields: [
            defineField({ name: 'phone', title: 'Telefon', type: 'string' }),
            defineField({ name: 'email', title: 'E-Mail', type: 'string' }),
        ]
    }),

    // 4. WORKFLOW (Zarządzanie)
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'workflow',
      options: { list: statusOptions, layout: 'radio' },
      initialValue: 'pending_approval',
    }),
    defineField({
      name: 'assignedProvider',
      title: 'Dienstleister',
      type: 'reference',
      group: 'workflow',
      to: [{ type: 'provider' }],
    }),
    defineField({
      name: 'approvedAt',
      title: 'Freigegeben am',
      type: 'datetime',
      group: 'workflow',
      readOnly: true,
    }),
    defineField({
      name: 'approvedBy',
      title: 'Freigegeben von',
      type: 'reference',
      group: 'workflow',
      to: [{ type: 'user' }],
      readOnly: true,
    }),

    // 5. ABSCHLUSS (Raport wykonania)
    defineField({
      name: 'resolutionData',
      title: 'Abschluss-Bericht',
      type: 'object',
      group: 'resolution',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'completedAt', title: 'Datum', type: 'datetime' }),
        defineField({ name: 'cost', title: 'Kosten (CHF)', type: 'number' }),
        defineField({ name: 'note', title: 'Notiz', type: 'text' }),
      ],
    }),
  ],

  // ── PROFESSIONAL PREVIEW (No Emojis) ───────────────────
  preview: {
    select: {
      title: 'title',
      status: 'status',
      priority: 'priority',
      scopeName: 'scope.name', // Nazwa budynku/mieszkania
      scopeTitle: 'scope.title', // Alternatywa dla pięter
      reporter: 'reportedByName',
      reporterLast: 'reportedByUser.lastName',
    },
    prepare({ title, status, priority, scopeName, scopeTitle, reporter, reporterLast }) {
      // Tłumaczenie statusów na czysty tekst
      const statusLabels: Record<string, string> = {
        pending_approval: 'Wartend',
        approved: 'Freigegeben',
        rejected: 'Abgelehnt',
        in_progress: 'In Arbeit',
        completed: 'Erledigt'
      }

      // Tłumaczenie priorytetów
      const priorityLabels: Record<string, string> = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        emergency: 'NOTFALL'
      }

      // Ikona statusu (używamy media, nie tekstu)
      const getStatusIcon = (s: string) => {
        switch(s) {
            case 'pending_approval': return HelpCircle
            case 'approved': return CheckCircle2
            case 'in_progress': return Clock
            case 'completed': return CheckCircle2
            case 'rejected': return XCircle
            default: return ClipboardList
        }
      }

      // Budowanie czytelnego podtytułu
      // Format: "NOTFALL • Mieszkanie 102 • Kowalski"
      const location = scopeName || scopeTitle || 'Unbekannt'
      const who = reporterLast || reporter || 'Anonim'
      const prio = priorityLabels[priority] || 'Medium'
      const stat = statusLabels[status] || status

      return {
        title: title,
        subtitle: `${prio} • ${stat} • ${location} (${who})`,
        media: getStatusIcon(status) // Dynamiczna ikona Lucide
      }
    },
  },
})