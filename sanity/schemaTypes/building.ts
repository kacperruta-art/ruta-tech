import {defineType, defineField, defineArrayMember} from 'sanity'
import {Home, Zap, Scale, FileBadge, Settings, Users, QrCode} from 'lucide-react'
import {QRCodeInput} from '../components/QRCodeInput'

// Canton List (Standard CH)
const cantonOptions = [
  {title: 'Zuerich', value: 'ZH'},
  {title: 'Bern', value: 'BE'},
  {title: 'Luzern', value: 'LU'},
  {title: 'Uri', value: 'UR'},
  {title: 'Schwyz', value: 'SZ'},
  {title: 'Obwalden', value: 'OW'},
  {title: 'Nidwalden', value: 'NW'},
  {title: 'Glarus', value: 'GL'},
  {title: 'Zug', value: 'ZG'},
  {title: 'Freiburg', value: 'FR'},
  {title: 'Solothurn', value: 'SO'},
  {title: 'Basel-Stadt', value: 'BS'},
  {title: 'Basel-Landschaft', value: 'BL'},
  {title: 'Schaffhausen', value: 'SH'},
  {title: 'Appenzell A.Rh.', value: 'AR'},
  {title: 'Appenzell I.Rh.', value: 'AI'},
  {title: 'St. Gallen', value: 'SG'},
  {title: 'Graubuenden', value: 'GR'},
  {title: 'Aargau', value: 'AG'},
  {title: 'Thurgau', value: 'TG'},
  {title: 'Tessin', value: 'TI'},
  {title: 'Waadt', value: 'VD'},
  {title: 'Wallis', value: 'VS'},
  {title: 'Neuenburg', value: 'NE'},
  {title: 'Genf', value: 'GE'},
  {title: 'Jura', value: 'JU'},
]

// Service Roles Matrix
const serviceRoleOptions = [
  {title: 'Facility Management (Hauswartung)', value: 'facility'},
  {title: 'HLKS (Heizung/Lueftung/Sanitaer)', value: 'hvac'},
  {title: 'Aufzug (Lift)', value: 'lift'},
  {title: 'Elektro', value: 'electrician'},
  {title: 'Reinigung', value: 'cleaning'},
  {title: 'Sicherheit / Schliesstechnik', value: 'security'},
  {title: 'Gartenpflege', value: 'gardening'},
  {title: 'Verwaltung', value: 'management'},
]

export const building = defineType({
  name: 'building',
  title: 'Gebaeude',
  type: 'document',
  icon: Home,
  groups: [
    {name: 'context', title: 'Basisdaten', default: true},
    {name: 'admin', title: 'Register & IDs', icon: FileBadge},
    {name: 'structure', title: 'Substanz & Flaechen', icon: Scale},
    {name: 'energy', title: 'Energie & Technik', icon: Zap},
    {name: 'access', title: 'Zugang', icon: Settings},
    {name: 'services', title: 'Dienstleister', icon: Users},
    {name: 'identification', title: 'QR & ID', icon: QrCode},
  ],
  fields: [
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{type: 'tenant'}],
      group: 'context',
      validation: (rule) => rule.required(),
    }),

    // === Group: context ===
    defineField({
      name: 'name',
      title: 'Gebaeude-Name / Nummer',
      type: 'string',
      group: 'context',
      description: 'z.B. "Haus A" oder "Bahnhofstrasse 44"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'context',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'property',
      title: 'Gehoert zu Liegenschaft',
      type: 'reference',
      to: [{type: 'property'}],
      group: 'context',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Adresse',
      type: 'object',
      group: 'context',
      fields: [
        defineField({name: 'street', title: 'Strasse & Nr.', type: 'string'}),
        defineField({name: 'zip', title: 'PLZ', type: 'string'}),
        defineField({name: 'city', title: 'Ort', type: 'string'}),
        defineField({
          name: 'canton',
          title: 'Kanton',
          type: 'string',
          options: {list: cantonOptions},
        }),
      ],
    }),

    // === Group: admin (Official IDs) ===
    defineField({
      name: 'egid',
      title: 'EGID (Eidg. Gebaeudeidentifikator)',
      type: 'number',
      group: 'admin',
      description: 'Offizielle Nummer im GWR.',
    }),
    defineField({
      name: 'assekuranzNr',
      title: 'Assekuranz-Nr. (GVZ)',
      type: 'string',
      group: 'admin',
    }),
    defineField({
      name: 'constructionYear',
      title: 'Baujahr',
      type: 'number',
      group: 'admin',
      validation: (rule) => rule.integer().min(1700).max(2100),
    }),
    defineField({
      name: 'renovationYear',
      title: 'Letzte Sanierung',
      type: 'number',
      group: 'admin',
    }),

    // === Group: structure (Metrics) ===
    defineField({
      name: 'cubicVolume',
      title: 'Gebaeudevolumen (m3)',
      type: 'number',
      group: 'structure',
      description: 'GVZ-Volumen',
    }),
    defineField({
      name: 'rentableArea',
      title: 'Hauptnutzflaeche (HNF m2)',
      type: 'number',
      group: 'structure',
    }),
    defineField({
      name: 'floorsAbove',
      title: 'Anzahl Obergeschosse',
      type: 'number',
      group: 'structure',
    }),
    defineField({
      name: 'roofType',
      title: 'Dachart',
      type: 'string',
      group: 'structure',
      options: {
        list: [
          {title: 'Flachdach (Kies)', value: 'flat_gravel'},
          {title: 'Flachdach (Begrunt)', value: 'flat_green'},
          {title: 'Steildach / Ziegel', value: 'pitched'},
          {title: 'Terrasse / Attika', value: 'terrace'},
        ],
      },
    }),

    // === Group: energy (Sustainability) ===
    defineField({
      name: 'energyLabel',
      title: 'GEAK / Energieklasse',
      type: 'string',
      group: 'energy',
      options: {
        list: [
          {title: 'A (Hocheffizient)', value: 'A'},
          {title: 'B', value: 'B'},
          {title: 'C', value: 'C'},
          {title: 'D', value: 'D'},
          {title: 'E', value: 'E'},
          {title: 'F', value: 'F'},
          {title: 'G (Sanierungsbeduerftig)', value: 'G'},
        ],
      },
    }),
    defineField({
      name: 'heatingType',
      title: 'Waermeerzeugung',
      type: 'string',
      group: 'energy',
      options: {
        list: [
          {title: 'Waermepumpe (Luft/Wasser)', value: 'hp_air'},
          {title: 'Waermepumpe (Erdsonde)', value: 'hp_ground'},
          {title: 'Fernwaerme', value: 'district'},
          {title: 'Gasheizung', value: 'gas'},
          {title: 'Oelheizung', value: 'oil'},
          {title: 'Pellets / Holz', value: 'wood'},
        ],
      },
    }),
    defineField({
      name: 'heatDistribution',
      title: 'Waermeverteilung',
      type: 'string',
      group: 'energy',
      options: {
        list: [
          {title: 'Bodenheizung', value: 'floor'},
          {title: 'Radiatoren', value: 'radiators'},
          {title: 'Gemischt', value: 'mixed'},
        ],
      },
    }),

    // === Group: access ===
    defineField({
      name: 'chatAccessPin',
      title: 'Globaler Chat-PIN',
      type: 'string',
      group: 'access',
      description: 'Notfall-PIN fuer Mieter (4 Ziffern).',
      validation: (rule) =>
        rule.regex(/^\d{4}$/, {name: '4-digit PIN', invert: false}),
    }),
    defineField({
      name: 'keySystem',
      title: 'Schliessanlage',
      type: 'string',
      group: 'access',
      description: 'z.B. KABA Star, KESO, Salto (Digital)',
    }),

    // === Group: services (The Matrix) ===
    defineField({
      name: 'serviceProviders',
      title: 'Zustaendige Dienstleister',
      type: 'array',
      group: 'services',
      description: 'Wer ist fuer dieses Gebaeude zustaendig?',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'serviceProviderEntry',
          title: 'Eintrag',
          fields: [
            defineField({
              name: 'role',
              title: 'Gewerk / Rolle',
              type: 'string',
              options: {list: serviceRoleOptions},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'provider',
              title: 'Firma',
              type: 'reference',
              to: [{type: 'provider'}],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'priority',
              title: 'Prioritaet',
              type: 'string',
              options: {
                list: [
                  {title: 'Hauptpartner', value: 'primary'},
                  {title: 'Ersatz / Backup', value: 'backup'},
                ],
              },
              initialValue: 'primary',
            }),
            defineField({
              name: 'customNote',
              title: 'Notiz (z.B. Vertragsnummer)',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              role: 'role',
              provider: 'provider.companyName',
              priority: 'priority',
            },
            prepare({role, provider, priority}) {
              const roleMap: Record<string, string> = {
                facility: 'Hauswartung',
                hvac: 'HLKS',
                lift: 'Lift',
                electrician: 'Elektro',
                cleaning: 'Reinigung',
                security: 'Sicherheit',
                gardening: 'Garten',
                management: 'Verwaltung',
              }
              return {
                title: `${roleMap[role] || role}`,
                subtitle: `${provider} ${priority === 'backup' ? '(Backup)' : ''}`,
                media: Users,
              }
            },
          },
        }),
      ],
    }),

    // === QR & Identification ===
    defineField({
      name: 'qrCodeGenerator',
      title: 'QR-Code Etikette',
      type: 'string',
      components: {input: QRCodeInput},
      group: 'identification',
      readOnly: true,
    }),
  ],
  preview: {
    select: {title: 'name', address: 'address.street', city: 'address.city'},
    prepare({title, address, city}) {
      return {
        title: title || 'Unbenannt',
        subtitle: [address, city].filter(Boolean).join(', '),
        media: Home,
      }
    },
  },
})
