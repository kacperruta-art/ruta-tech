import { defineType, defineField } from 'sanity'
import { ClipboardList } from 'lucide-react'

// ── Status Workflow (Gatekeeper Pattern) ─────────────────
const statusOptions = [
  { title: '🟡 Warte auf Freigabe', value: 'pending_approval' },
  { title: '🟢 Freigegeben / Beauftragt', value: 'approved' },
  { title: '🔴 Abgelehnt', value: 'rejected' },
  { title: '🔵 In Bearbeitung', value: 'in_progress' },
  { title: '✅ Abgeschlossen', value: 'completed' },
]

// ── Priority Options ─────────────────────────────────────
const priorityOptions = [
  { title: '⬜ Niedrig', value: 'low' },
  { title: '🟨 Mittel', value: 'medium' },
  { title: '🟧 Hoch', value: 'high' },
  { title: '🟥 Notfall', value: 'emergency' },
]

// ── Schema Definition ────────────────────────────────────

export const ticket = defineType({
  name: 'ticket',
  title: 'Ticket',
  type: 'document',
  icon: ClipboardList,
  groups: [
    { name: 'issue', title: 'Problem', default: true },
    { name: 'workflow', title: 'Workflow & Freigabe' },
    { name: 'context', title: 'Kontext & Standort' },
    { name: 'resolution', title: 'Abschluss' },
  ],
  fields: [
    // ── Tenant (Company) ───────────────────────────────────
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{ type: 'tenant' }],
      validation: (rule) => rule.required(),
    }),

    // ══════════════════════════════════════════════════════
    // GROUP: Issue (The Problem)
    // ══════════════════════════════════════════════════════

    defineField({
      name: 'title',
      title: 'Kurzbeschreibung',
      type: 'string',
      group: 'issue',
      description: 'Kurze Zusammenfassung des Problems.',
      validation: (rule) => rule.required().max(120),
    }),

    defineField({
      name: 'description',
      title: 'Detaillierte Beschreibung',
      type: 'text',
      group: 'issue',
      rows: 5,
      description: 'Ausführliche Problembeschreibung (von Chat/Mieter).',
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
      title: 'Bilder / Nachweise',
      type: 'array',
      group: 'issue',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'caption',
              title: 'Beschriftung',
              type: 'string',
            }),
          ],
        },
      ],
      description: 'Fotos vom Problem (aus Chat hochgeladen).',
    }),

    // ══════════════════════════════════════════════════════
    // GROUP: Workflow (Gatekeeper Pattern)
    // ══════════════════════════════════════════════════════

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'workflow',
      options: { list: statusOptions, layout: 'radio' },
      initialValue: 'pending_approval',
      validation: (rule) => rule.required(),
      description:
        'Tickets starten im Status "Warte auf Freigabe" und erfordern Manager-Genehmigung vor der Weiterleitung an Dienstleister.',
    }),

    defineField({
      name: 'assignedProvider',
      title: 'Beauftragter Dienstleister',
      type: 'reference',
      group: 'workflow',
      to: [{ type: 'provider' }],
      description:
        'Wird normalerweise erst nach Freigabe ausgefüllt. Leer bei "Warte auf Freigabe".',
    }),

    defineField({
      name: 'approvalNote',
      title: 'Freigabe-Kommentar',
      type: 'text',
      group: 'workflow',
      rows: 3,
      description: 'Optionaler Kommentar des Managers bei Freigabe/Ablehnung.',
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
      description: 'Der Manager, der das Ticket freigegeben hat.',
    }),

    // ══════════════════════════════════════════════════════
    // GROUP: Context (Location & Reporter)
    // ══════════════════════════════════════════════════════

    defineField({
      name: 'scope',
      title: 'Standort / Bezug',
      type: 'reference',
      group: 'context',
      to: [
        { type: 'property' },
        { type: 'building' },
        { type: 'floor' },
        { type: 'unit' },
        { type: 'asset' },
      ],
      validation: (rule) => rule.required(),
      description: 'Polymorphe Referenz: Auf welches Objekt bezieht sich das Ticket?',
    }),

    defineField({
      name: 'reportedByName',
      title: 'Gemeldet von (Name)',
      type: 'string',
      group: 'context',
      description: 'Name des Meldenden (aus Chat-Eingabe).',
    }),

    defineField({
      name: 'reportedByUser',
      title: 'Gemeldet von (Benutzer)',
      type: 'reference',
      group: 'context',
      to: [{ type: 'user' }],
      description: 'Falls ein registrierter Benutzer gemeldet hat.',
    }),

    defineField({
      name: 'reportedByContact',
      title: 'Kontakt des Meldenden',
      type: 'object',
      group: 'context',
      fields: [
        defineField({
          name: 'phone',
          title: 'Telefon',
          type: 'string',
        }),
        defineField({
          name: 'email',
          title: 'E-Mail',
          type: 'string',
        }),
        defineField({
          name: 'unit',
          title: 'Wohneinheit',
          type: 'string',
          description: 'z.B. "Wohnung 3.02"',
        }),
      ],
    }),

    defineField({
      name: 'chatSessionId',
      title: 'Chat-Session-ID',
      type: 'string',
      group: 'context',
      description: 'Verknüpfung zum ursprünglichen Chat-Konversation.',
      readOnly: true,
    }),

    // ── Legacy Context Snapshot (for backwards compatibility) ──
    defineField({
      name: 'locationContext',
      title: 'Standort-Snapshot (Legacy)',
      type: 'object',
      group: 'context',
      description: 'Snapshot des Standorts zum Zeitpunkt der Erstellung.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'propertyName', title: 'Liegenschaft', type: 'string' }),
        defineField({ name: 'buildingName', title: 'Gebäude', type: 'string' }),
        defineField({ name: 'floorTitle', title: 'Stockwerk', type: 'string' }),
        defineField({ name: 'unitName', title: 'Einheit', type: 'string' }),
        defineField({ name: 'assetName', title: 'Anlage', type: 'string' }),
      ],
    }),

    // ══════════════════════════════════════════════════════
    // GROUP: Resolution (Completion Data)
    // ══════════════════════════════════════════════════════

    defineField({
      name: 'resolutionData',
      title: 'Abschluss-Daten',
      type: 'object',
      group: 'resolution',
      description: 'Wird vom Dienstleister nach Fertigstellung ausgefüllt.',
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
          description: 'Pflicht bei Status "Abgeschlossen".',
          options: { hotspot: true },
        }),
        defineField({
          name: 'partsReplaced',
          title: 'Ersetzte Teile',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'costEstimate',
          title: 'Kostenvoranschlag (CHF)',
          type: 'number',
        }),
        defineField({
          name: 'completedAt',
          title: 'Abgeschlossen am',
          type: 'datetime',
        }),
      ],
    }),
  ],

  // ── Preview (Traffic Light System) ─────────────────────
  preview: {
    select: {
      title: 'title',
      status: 'status',
      priority: 'priority',
      scopeProperty: 'scope.name',
      scopeBuilding: 'scope.name',
      scopeFloor: 'scope.title',
      scopeUnit: 'scope.name',
      scopeAsset: 'scope.name',
      scopeType: 'scope._type',
      // Location context for richer subtitle
      locationBuilding: 'locationContext.buildingName',
      locationUnit: 'locationContext.unitName',
      locationAsset: 'locationContext.assetName',
    },
    prepare({
      title,
      status,
      priority,
      scopeProperty,
      scopeBuilding,
      scopeFloor,
      scopeUnit,
      scopeAsset,
      scopeType,
      locationBuilding,
      locationUnit,
      locationAsset,
    }) {
      // ── Priority Indicator (The "Siren") ─────────────────
      // High-contrast colors for quick scanning in list view
      const priorityEmoji =
        priority === 'emergency'
          ? '🚨' // CRITICAL: Immediate attention required
          : priority === 'high'
            ? '🔴' // HIGH: Urgent
            : priority === 'medium'
              ? '🟠' // MEDIUM: Standard
              : '🔵' // LOW: When convenient

      // ── Status Indicator (The "State") ───────────────────
      const statusEmoji =
        status === 'pending_approval'
          ? '🟡' // Waiting for manager approval
          : status === 'approved'
            ? '🟢' // Approved, ready for dispatch
            : status === 'rejected'
              ? '⛔' // Rejected by manager
              : status === 'in_progress'
                ? '🏗️' // Work in progress
                : status === 'completed'
                  ? '✅' // Done
                  : '⚪' // Unknown

      // Status text label (German)
      const statusLabel =
        status === 'pending_approval'
          ? 'Warte auf Freigabe'
          : status === 'approved'
            ? 'Freigegeben'
            : status === 'rejected'
              ? 'Abgelehnt'
              : status === 'in_progress'
                ? 'In Bearbeitung'
                : status === 'completed'
                  ? 'Abgeschlossen'
                  : 'Unbekannt'

      // ── Location Context ─────────────────────────────────
      // Build a readable location path from available data
      const scopeName =
        scopeType === 'floor'
          ? scopeFloor
          : scopeAsset || scopeUnit || scopeBuilding || scopeProperty

      // Fallback to legacy locationContext if scope is not resolved
      const locationPath = [
        locationBuilding,
        locationUnit || scopeUnit,
        locationAsset || scopeAsset,
      ]
        .filter(Boolean)
        .join(' > ')

      const location = scopeName || locationPath || 'Standort unbekannt'

      return {
        title: `${priorityEmoji} ${title || 'Ohne Titel'}`,
        subtitle: `${statusEmoji} ${statusLabel} • ${location}`,
      }
    },
  },

  // ── Orderings ──────────────────────────────────────────
  orderings: [
    {
      title: 'Status (Pending First)',
      name: 'statusPendingFirst',
      by: [
        { field: 'status', direction: 'asc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
    {
      title: 'Priorität (Höchste zuerst)',
      name: 'priorityDesc',
      by: [
        { field: 'priority', direction: 'desc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
    {
      title: 'Neueste zuerst',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
})
