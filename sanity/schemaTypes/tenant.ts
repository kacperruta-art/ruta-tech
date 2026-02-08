import { defineType, defineField } from 'sanity'
import { Building2 } from 'lucide-react'

const cantonOptions = [
  { title: 'Zürich', value: 'ZH' },
  { title: 'Bern', value: 'BE' },
  { title: 'Luzern', value: 'LU' },
  { title: 'Uri', value: 'UR' },
  { title: 'Schwyz', value: 'SZ' },
  { title: 'Obwalden', value: 'OW' },
  { title: 'Nidwalden', value: 'NW' },
  { title: 'Glarus', value: 'GL' },
  { title: 'Zug', value: 'ZG' },
  { title: 'Freiburg', value: 'FR' },
  { title: 'Solothurn', value: 'SO' },
  { title: 'Basel-Stadt', value: 'BS' },
  { title: 'Basel-Landschaft', value: 'BL' },
  { title: 'Schaffhausen', value: 'SH' },
  { title: 'Appenzell A.Rh.', value: 'AR' },
  { title: 'Appenzell I.Rh.', value: 'AI' },
  { title: 'St. Gallen', value: 'SG' },
  { title: 'Graubünden', value: 'GR' },
  { title: 'Aargau', value: 'AG' },
  { title: 'Thurgau', value: 'TG' },
  { title: 'Tessin', value: 'TI' },
  { title: 'Waadt', value: 'VD' },
  { title: 'Wallis', value: 'VS' },
  { title: 'Neuenburg', value: 'NE' },
  { title: 'Genf', value: 'GE' },
  { title: 'Jura', value: 'JU' },
]

export const tenant = defineType({
  name: 'tenant',
  title: 'Mandant',
  type: 'document',
  icon: Building2,

  groups: [
    { name: 'general', title: 'Stammdaten', default: true },
    { name: 'branding', title: 'Branding & Design' },
    { name: 'auth', title: 'Login & Zugang' }, // NOWE
    { name: 'contact', title: 'Kontakt & Support' },
    { name: 'legal', title: 'Rechtliches & Vertrag' },
    { name: 'subscription', title: 'Abo & Limits' },
    { name: 'data', title: 'Daten & Import' }, // NOWE
    { name: 'system', title: 'System & Konfiguration' },
  ],

  fields: [
    // ══════════════════════════════════════════════════
    // ── Group: general — Stammdaten ──────────────────
    // ══════════════════════════════════════════════════

    defineField({
      name: 'name',
      title: 'Anzeigename (Intern)',
      type: 'string',
      group: 'general',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'ID (Slug)',
      type: 'slug',
      group: 'general',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'legalName',
      title: 'Offizieller Firmenname (AG/GmbH)',
      type: 'string',
      group: 'general',
    }),
    defineField({
      name: 'uidNumber',
      title: 'UID-Nummer (z.B. CHE-123.456.789)',
      type: 'string',
      group: 'general',
      validation: (rule) =>
        rule.regex(/^CHE-\d{3}\.\d{3}\.\d{3}$/, {
          name: 'UID format',
          invert: false,
        }),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'general',
      options: {
        list: [
          { title: 'Aktiv', value: 'active' },
          { title: 'Gesperrt', value: 'suspended' },
          { title: 'Wartung', value: 'maintenance' },
        ],
      },
      initialValue: 'active',
    }),
    defineField({
      name: 'address',
      title: 'Hauptsitz Adresse',
      type: 'object',
      group: 'general',
      fields: [
        defineField({ name: 'street', title: 'Strasse', type: 'string' }),
        defineField({ name: 'zip', title: 'PLZ', type: 'string' }),
        defineField({ name: 'city', title: 'Ort', type: 'string' }),
        defineField({
          name: 'canton',
          title: 'Kanton',
          type: 'string',
          options: { list: cantonOptions },
        }),
      ],
    }),

    // ══════════════════════════════════════════════════
    // ── Group: branding — Branding & Design ──────────
    // ══════════════════════════════════════════════════

    defineField({
      name: 'brandPrimary',
      title: 'Primärfarbe (Farbschema)',
      type: 'string',
      group: 'branding',
      description: 'Hex-Farbcode, z.B. #0066AA. Wird im Chat-Interface verwendet.',
      validation: (rule) =>
        rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
          name: 'hex color',
          invert: false,
        }),
    }),
    defineField({
      name: 'logoLight',
      title: 'Logo (Heller Hintergrund)',
      type: 'image',
      group: 'branding',
      options: { hotspot: true },
    }),
    defineField({
      name: 'logoDark',
      title: 'Logo (Dunkler Hintergrund)',
      type: 'image',
      group: 'branding',
      options: { hotspot: true },
    }),
    defineField({
      name: 'domains',
      title: 'Verbundene Domains',
      type: 'array',
      group: 'branding',
      of: [{ type: 'string' }],
      description: 'Index 0 ist die primäre Domain.',
    }),
    
    // NOWE: Konfiguracja druku (PDF)
    defineField({
        name: 'printConfig',
        title: 'PDF & Druck Konfiguration',
        type: 'object',
        group: 'branding',
        options: { collapsible: true, collapsed: true },
        fields: [
            defineField({
                name: 'printLogo',
                title: 'Logo für Druck (High-Res/CMYK)',
                type: 'image',
                description: 'Wird für generierte PDFs verwendet.'
            }),
            defineField({
                name: 'footerText',
                title: 'Fusszeile Text',
                type: 'text',
                rows: 2,
                description: 'Erscheint auf jeder PDF-Seite unten (z.B. Adresse, IBAN).'
            }),
             defineField({
                name: 'accentColorPrint',
                title: 'Akzentfarbe Druck',
                type: 'string',
                description: 'Falls abweichend vom Digital-Brand (Hex).'
            })
        ]
    }),

    // ══════════════════════════════════════════════════
    // ── Group: auth — Login & Zugang (NOWE) ──────────
    // ══════════════════════════════════════════════════
    
    defineField({
        name: 'authConfig',
        title: 'Zugangskonfiguration',
        type: 'object',
        group: 'auth',
        fields: [
            defineField({
                name: 'portalDomain',
                title: 'Kunden-Portal Domain',
                type: 'string',
                description: 'z.B. app.immo-1.ch (muss DNS konfiguriert sein)'
            }),
            defineField({
                name: 'ssoEnabled',
                title: 'Single Sign-On (SSO) aktiv?',
                type: 'boolean',
                initialValue: false
            }),
            defineField({
                name: 'idpProvider',
                title: 'Identity Provider',
                type: 'string',
                hidden: ({parent}) => !parent?.ssoEnabled,
                options: {
                    list: [
                        { title: 'Microsoft Entra ID (Azure AD)', value: 'azure-ad' },
                        { title: 'Google Workspace', value: 'google' },
                        { title: 'Okta', value: 'okta' }
                    ]
                }
            }),
            defineField({
                name: 'tenantId',
                title: 'SSO Tenant ID',
                type: 'string',
                hidden: ({parent}) => !parent?.ssoEnabled,
                description: 'Die ID vom Provider (z.B. Azure Tenant ID)'
            })
        ]
    }),

    // ══════════════════════════════════════════════════
    // ── Group: contact — Kontakt & Support ───────────
    // ══════════════════════════════════════════════════

    defineField({
      name: 'supportEmail',
      title: 'Support-Email (für Mieter)',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'supportPhone',
      title: 'Support-Telefon (Notfall)',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'billingEmail',
      title: 'Rechnungs-Email (Intern)',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'adminContact',
      title: 'Hauptansprechpartner (Admin)',
      type: 'reference',
      to: [{ type: 'user' }],
      group: 'contact',
    }),

    // ══════════════════════════════════════════════════
    // ── Group: legal — Rechtliches & Vertrag ─────────
    // ══════════════════════════════════════════════════

    defineField({
      name: 'contractStartDate',
      title: 'Vertragsbeginn',
      type: 'date',
      group: 'legal',
    }),
    defineField({
      name: 'contractRenewalDate',
      title: 'Nächste Verlängerung',
      type: 'date',
      group: 'legal',
    }),
    defineField({
      name: 'documents',
      title: 'Vertragsdokumente & AGB',
      type: 'array',
      group: 'legal',
      of: [
        {
          type: 'file',
          options: { accept: '.pdf' },
        },
      ],
    }),

    // ══════════════════════════════════════════════════
    // ── Group: subscription — Abo & Limits ───────────
    // ══════════════════════════════════════════════════

    defineField({
      name: 'plan',
      title: 'Gebuchtes Paket',
      type: 'string',
      group: 'subscription',
      options: {
        list: [
          { title: 'Starter', value: 'starter' },
          { title: 'Professional', value: 'professional' },
          { title: 'Enterprise', value: 'enterprise' },
        ],
      },
      initialValue: 'starter',
    }),
    defineField({
      name: 'maxUsers',
      title: 'Max. Benutzer (Lizenz)',
      type: 'number',
      group: 'subscription',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'maxProperties',
      title: 'Max. Liegenschaften (Lizenz)',
      type: 'number',
      group: 'subscription',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'paperExportEnabled',
      title: 'Papier-Dokumentation Export aktiv?',
      type: 'boolean',
      group: 'subscription',
      initialValue: false,
    }),

    // ══════════════════════════════════════════════════
    // ── Group: data — Daten & Import (NOWE) ──────────
    // ══════════════════════════════════════════════════

    defineField({
        name: 'importConfig',
        title: 'Daten-Import Konfiguration',
        type: 'object',
        group: 'data',
        fields: [
            defineField({
                name: 'latestImportFile',
                title: 'Struktur-Import (CSV)',
                type: 'file',
                description: 'Laden Sie hier die CSV-Datei hoch, um die Gebäudestruktur zu generieren. Format: Property,Building,Floor,Unit',
                options: { accept: '.csv' }
            }),
            defineField({
                name: 'lastImportDate',
                title: 'Letzter Import',
                type: 'datetime',
                readOnly: true
            }),
            defineField({
                name: 'importStatus',
                title: 'Import Status',
                type: 'string',
                readOnly: true,
                options: {
                    list: [
                        { title: 'Bereit', value: 'idle' },
                        { title: 'Verarbeitung...', value: 'processing' },
                        { title: 'Abgeschlossen', value: 'completed' },
                        { title: 'Fehler', value: 'error' }
                    ]
                },
                initialValue: 'idle'
            })
        ]
    }),

    // ══════════════════════════════════════════════════
    // ── Group: system — System & Konfiguration ───────
    // ══════════════════════════════════════════════════

    defineField({
      name: 'defaultLocale',
      title: 'Standard-Sprache',
      type: 'string',
      group: 'system',
      options: {
        list: [
          { title: 'Deutsch (CH)', value: 'de-CH' },
          { title: 'Französisch (CH)', value: 'fr-CH' },
          { title: 'Italienisch (CH)', value: 'it-CH' },
          { title: 'English', value: 'en' },
        ],
      },
      initialValue: 'de-CH',
    }),
    defineField({
      name: 'supportedLocales',
      title: 'Unterstützte Sprachen',
      type: 'array',
      group: 'system',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Deutsch (CH)', value: 'de-CH' },
          { title: 'Französisch (CH)', value: 'fr-CH' },
          { title: 'Italienisch (CH)', value: 'it-CH' },
          { title: 'English', value: 'en' },
        ],
      },
    }),
    defineField({
      name: 'toneOfVoice',
      title: 'KI-Tonalität',
      type: 'string',
      group: 'system',
      options: {
        list: [
          { title: 'Formell (Sie)', value: 'formal' },
          { title: 'Direkt (Du)', value: 'direct' },
        ],
      },
      initialValue: 'formal',
    }),
    defineField({
      name: 'autoReply',
      title: 'Automatische KI-Antwort',
      type: 'boolean',
      group: 'system',
      initialValue: true,
    }),
    defineField({
      name: 'escalationKeywords',
      title: 'Eskalations-Schlüsselwörter',
      type: 'array',
      group: 'system',
      of: [{ type: 'string' }],
      description: 'Wörter, die eine sofortige Eskalation an den Dienstleister auslösen.',
    }),
    defineField({
      name: 'deploymentStatus',
      title: 'System-Status',
      type: 'string',
      group: 'system',
      options: {
        list: [
          { title: 'Ausstehend', value: 'pending' },
          { title: 'Aktiv', value: 'active' },
          { title: 'Wartung', value: 'maintenance' },
        ],
      },
      initialValue: 'active',
    }),
  ],

  preview: {
    select: { title: 'name', subtitle: 'plan', status: 'status' },
    prepare({ title, subtitle, status }) {
      const statusEmoji =
        status === 'active' ? '🟢' : status === 'suspended' ? '🔴' : '🟡'
      return {
        title: `${statusEmoji} ${title || 'Unbenannt'}`,
        subtitle: subtitle ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1) : '',
      }
    },
  },

  // Ensure reference search can find tenants by name, legalName, or slug
  __experimental_search: [
    {path: 'name', weight: 10},
    {path: 'legalName', weight: 5},
    {path: 'slug.current', weight: 3},
  ],
})