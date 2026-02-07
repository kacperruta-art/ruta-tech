import {defineType, defineField} from 'sanity'
import {DoorOpen, Ruler, FileBadge, ShieldAlert, Users, Box, QrCode} from 'lucide-react'
import {QRCodeInput} from '../components/QRCodeInput'

export const unit = defineType({
  name: 'unit',
  title: 'Nutzungseinheit',
  type: 'document',
  icon: DoorOpen,
  groups: [
    {name: 'core', title: 'Basisdaten', default: true},
    {name: 'admin', title: 'Register & IDs', icon: FileBadge},
    {name: 'specs', title: 'Flaechen & Zimmer', icon: Ruler},
    {name: 'tech', title: 'Technik & Sicherheit', icon: ShieldAlert},
    {name: 'people', title: 'Personen', icon: Users},
    {name: 'inventory', title: 'Inventar', icon: Box},
    {name: 'identification', title: 'QR & ID', icon: QrCode},
  ],
  fields: [
    // === Group: core ===
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{type: 'tenant'}],
      group: 'core',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Interne Bezeichnung',
      type: 'string',
      group: 'core',
      description: 'z.B. "Wohnung 3.01" oder "Ladenflaeche EG"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'core',
      options: {source: 'name', maxLength: 96},
    }),
    defineField({
      name: 'building',
      title: 'Gebaeude',
      type: 'reference',
      to: [{type: 'building'}],
      group: 'core',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'floor',
      title: 'Stockwerk',
      type: 'reference',
      to: [{type: 'floor'}],
      group: 'core',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'core',
      options: {
        list: [
          {title: 'Vermietet / Belegt', value: 'occupied'},
          {title: 'Leerstehend', value: 'vacant'},
          {title: 'In Sanierung', value: 'renovation'},
          {title: 'Reserviert', value: 'reserved'},
        ],
      },
      initialValue: 'occupied',
    }),
    defineField({
      name: 'usageType',
      title: 'Nutzungsart',
      type: 'string',
      group: 'core',
      options: {
        list: [
          {title: 'Wohnen', value: 'residential'},
          {title: 'Buero / Gewerbe', value: 'commercial'},
          {title: 'Gastronomie', value: 'gastro'},
          {title: 'Lager / Archiv', value: 'storage'},
        ],
      },
      initialValue: 'residential',
    }),

    // === Group: admin (GWR Data) ===
    defineField({
      name: 'ewid',
      title: 'EWID (Amtliche Wohnungs-ID)',
      type: 'string',
      group: 'admin',
      description: 'Code gemaess GWR (z.B. W-01). Wichtig fuer Meldewesen.',
    }),
    defineField({
      name: 'adminNumber',
      title: 'Objekt-Nr. (Verwaltung)',
      type: 'string',
      group: 'admin',
      description:
        'Nummer aus der Buchhaltungs-Software (z.B. 10.202.01).',
    }),

    // === Group: specs (Metrics) ===
    defineField({
      name: 'rooms',
      title: 'Zimmerzahl',
      type: 'number',
      group: 'specs',
      description: 'z.B. 3.5 oder 4.0',
    }),
    defineField({
      name: 'areaHnf',
      title: 'Hauptnutzflaeche (HNF m2)',
      type: 'number',
      group: 'specs',
    }),
    defineField({
      name: 'areaOutside',
      title: 'Aussenflaeche (Balkon/Terrasse m2)',
      type: 'number',
      group: 'specs',
    }),
    defineField({
      name: 'floorPlan',
      title: 'Wohnungsgrundriss',
      type: 'image',
      group: 'specs',
      options: {hotspot: true},
    }),

    // === Group: tech (Emergency Info) ===
    defineField({
      name: 'waterShutoffLocation',
      title: 'Standort Wasser-Absperrhahn',
      type: 'string',
      group: 'tech',
      description:
        'Wo muss der Mieter drehen, wenn Wasser auslaeuft? (z.B. "Bad unter Lavabo")',
    }),
    defineField({
      name: 'fuseBoxLocation',
      title: 'Standort Sicherungskasten',
      type: 'string',
      group: 'tech',
      description: 'z.B. "Korridor, oben links"',
    }),
    defineField({
      name: 'cellarNumber',
      title: 'Kellerabteil Nr.',
      type: 'string',
      group: 'tech',
    }),
    defineField({
      name: 'mailboxNumber',
      title: 'Briefkasten Nr.',
      type: 'string',
      group: 'tech',
    }),

    // === Group: people ===
    defineField({
      name: 'tenants',
      title: 'Hauptmieter (Vertragspartner)',
      type: 'array',
      group: 'people',
      of: [{type: 'reference', to: [{type: 'user'}]}],
    }),
    defineField({
      name: 'residents',
      title: 'Weitere Bewohner',
      type: 'array',
      group: 'people',
      of: [{type: 'reference', to: [{type: 'user'}]}],
    }),

    // === Group: inventory ===
    defineField({
      name: 'inventoryNote',
      title: 'Inventar-Notiz',
      type: 'text',
      rows: 3,
      group: 'inventory',
      description:
        'Generelle Bemerkung zur Ausstattung (Details bitte als Assets erfassen).',
    }),
    defineField({
      name: 'smartDevices',
      title: 'Verknuepfte Smart-Geraete',
      type: 'array',
      group: 'inventory',
      of: [{type: 'reference', to: [{type: 'asset'}]}],
      description: 'Geraete mit direkter Digitalanbindung.',
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
    select: {
      name: 'name',
      rooms: 'rooms',
      status: 'status',
      building: 'building.name',
    },
    prepare({name, rooms, status, building}) {
      const statusLabel =
        status === 'vacant'
          ? 'Leer'
          : status === 'renovation'
            ? 'Sanierung'
            : status === 'reserved'
              ? 'Reserviert'
              : 'Belegt'
      return {
        title: name || 'Unbenannt',
        subtitle: [building, rooms ? `${rooms} Zi.` : '', statusLabel]
          .filter(Boolean)
          .join(' · '),
        media: DoorOpen,
      }
    },
  },
})
