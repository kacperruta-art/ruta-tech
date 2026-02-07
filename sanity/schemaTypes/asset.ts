import {defineType, defineField, defineArrayMember} from 'sanity'
import {
  Package,
  MapPin,
  Activity,
  Wrench,
  Banknote,
  Wifi,
  Gauge,
  Settings,
  TrendingDown,
  QrCode,
} from 'lucide-react'
import {QRCodeInput} from '../components/QRCodeInput'

export const asset = defineType({
  name: 'asset',
  title: 'Anlage / Asset',
  type: 'document',
  icon: Package,
  groups: [
    {name: 'identity', title: 'Identitaet', default: true},
    {name: 'lifecycle', title: 'Lifecycle & CAPEX (PAL)', icon: TrendingDown},
    {name: 'location', title: 'Standort', icon: MapPin},
    {name: 'specs', title: 'Technik', icon: Settings},
    {name: 'service', title: 'Service', icon: Wrench},
    {name: 'iot', title: 'IoT', icon: Wifi},
    {name: 'metering', title: 'Zaehler', icon: Gauge},
    {name: 'identification', title: 'QR & ID', icon: QrCode},
  ],
  fields: [
    // ══════════════════════════════════════════════════
    // ── IDENTITY ─────────────────────────────────────
    // ══════════════════════════════════════════════════
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{type: 'tenant'}],
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Bezeichnung',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'qrCodeId',
      title: 'QR-Code ID',
      type: 'slug',
      group: 'identity',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          {title: 'HVAC (Heizung/Lueftung)', value: 'hvac'},
          {title: 'Sanitaer', value: 'plumbing'},
          {title: 'Elektro', value: 'electric'},
          {title: 'Weisse Ware', value: 'appliance'},
          {title: 'Gebaeudehulle', value: 'shell'},
          {title: 'Aussenanlage', value: 'outdoor'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Bild',
      type: 'image',
      group: 'identity',
      options: {hotspot: true},
    }),

    // ══════════════════════════════════════════════════
    // ── LIFECYCLE (PAL ENGINE) ───────────────────────
    // ══════════════════════════════════════════════════
    defineField({
      name: 'installDate',
      title: 'Installationsdatum',
      type: 'date',
      group: 'lifecycle',
      validation: (rule) =>
        rule.required().warning('Ohne Datum keine PAL-Berechnung moeglich!'),
    }),
    defineField({
      name: 'expectedLifespan',
      title: 'Erwartete Lebensdauer (Jahre)',
      type: 'number',
      group: 'lifecycle',
      initialValue: 15,
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'initialCost',
      title: 'Anschaffungswert (CHF)',
      type: 'number',
      group: 'lifecycle',
      description: 'Historischer Kaufpreis.',
    }),
    defineField({
      name: 'replacementCost',
      title: 'Wiederbeschaffungswert (CHF)',
      type: 'number',
      group: 'lifecycle',
      description: 'Geschaetzte Kosten fuer Ersatz heute (CAPEX Basis).',
    }),
    defineField({
      name: 'manualCondition',
      title: 'Zustand (Manuell)',
      type: 'string',
      group: 'lifecycle',
      options: {
        list: [
          {title: 'Neuwertig (100%)', value: 'new'},
          {title: 'Gut (80%)', value: 'good'},
          {title: 'Abgenutzt (50%)', value: 'worn'},
          {title: 'Kritisch / EOL (20%)', value: 'critical'},
          {title: 'Defekt (0%)', value: 'defect'},
        ],
      },
      description: 'Ueberschreibt die automatische Berechnung.',
    }),
    defineField({
      name: 'warrantyExpiration',
      title: 'Garantie bis',
      type: 'date',
      group: 'lifecycle',
    }),

    // ══════════════════════════════════════════════════
    // ── LOCATION (POLYMORPHIC) ───────────────────────
    // ══════════════════════════════════════════════════
    defineField({
      name: 'location',
      title: 'Physischer Standort',
      type: 'reference',
      group: 'location',
      to: [
        {type: 'property'},
        {type: 'building'},
        {type: 'floor'},
        {type: 'unit'},
        {type: 'parkingFacility'},
        {type: 'outdoorArea'},
      ],
    }),

    // ══════════════════════════════════════════════════
    // ── SPECS ────────────────────────────────────────
    // ══════════════════════════════════════════════════
    defineField({
      name: 'manufacturer',
      title: 'Hersteller',
      type: 'string',
      group: 'specs',
    }),
    defineField({
      name: 'model',
      title: 'Modell',
      type: 'string',
      group: 'specs',
    }),
    defineField({
      name: 'serialNumber',
      title: 'Seriennummer',
      type: 'string',
      group: 'specs',
    }),
    defineField({
      name: 'attributes',
      title: 'Technische Attribute',
      type: 'array',
      group: 'specs',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'key', title: 'Eigenschaft', type: 'string'}),
            defineField({name: 'value', title: 'Wert', type: 'string'}),
          ],
          preview: {select: {title: 'key', subtitle: 'value'}},
        }),
      ],
    }),
    defineField({
      name: 'documents',
      title: 'Dokumente / Manuals',
      type: 'array',
      group: 'specs',
      of: [{type: 'file'}],
    }),

    // ══════════════════════════════════════════════════
    // ── SERVICE ──────────────────────────────────────
    // ══════════════════════════════════════════════════
    defineField({
      name: 'maintainedBy',
      title: 'Service-Partner',
      type: 'reference',
      to: [{type: 'provider'}],
      group: 'service',
    }),
    defineField({
      name: 'lastServiceDate',
      title: 'Letzte Wartung',
      type: 'date',
      group: 'service',
    }),

    // ══════════════════════════════════════════════════
    // ── IOT ──────────────────────────────────────────
    // ══════════════════════════════════════════════════
    defineField({
      name: 'iotDeviceId',
      title: 'IoT Device ID / MAC',
      type: 'string',
      group: 'iot',
    }),
    defineField({
      name: 'connectivityProtocol',
      title: 'Protokoll',
      type: 'string',
      group: 'iot',
      options: {
        list: [
          {title: 'WLAN', value: 'wifi'},
          {title: 'LoRaWAN', value: 'lora'},
          {title: 'Matter / Thread', value: 'matter'},
          {title: 'Modbus / KNX', value: 'bus'},
          {title: 'Mobilfunk (4G/5G/NB-IoT)', value: 'cellular'},
        ],
      },
    }),

    // ══════════════════════════════════════════════════
    // ── METERING (Zaehler) ───────────────────────────
    // ══════════════════════════════════════════════════
    defineField({
      name: 'isMeter',
      title: 'Ist Zaehler?',
      type: 'boolean',
      group: 'metering',
      initialValue: false,
    }),
    defineField({
      name: 'meterUnit',
      title: 'Einheit',
      type: 'string',
      group: 'metering',
      hidden: ({parent}) => !parent?.isMeter,
      options: {
        list: [
          {title: 'kWh', value: 'kWh'},
          {title: 'm3', value: 'm3'},
          {title: 'Liter', value: 'Liter'},
        ],
      },
    }),
    defineField({
      name: 'meterType',
      title: 'Medium',
      type: 'string',
      group: 'metering',
      hidden: ({parent}) => !parent?.isMeter,
      options: {
        list: [
          {title: 'Strom', value: 'electricity'},
          {title: 'Wasser (Kalt)', value: 'water_cold'},
          {title: 'Wasser (Warm)', value: 'water_hot'},
          {title: 'Gas', value: 'gas'},
          {title: 'Heizung / Waerme', value: 'heat'},
        ],
      },
    }),

    // ══════════════════════════════════════════════════
    // ── QR & IDENTIFICATION ──────────────────────────
    // ══════════════════════════════════════════════════
    defineField({
      name: 'qrCodeGenerator',
      title: 'QR-Code Etikette',
      type: 'string',
      components: {input: QRCodeInput},
      group: 'identification',
      readOnly: true,
    }),
  ],

  // ══════════════════════════════════════════════════
  // ── SMART PREVIEW (VISUAL HEALTH BAR) ─────────────
  // ══════════════════════════════════════════════════
  preview: {
    select: {
      title: 'name',
      installDate: 'installDate',
      lifespan: 'expectedLifespan',
      manualCondition: 'manualCondition',
      media: 'image',
    },
    prepare({title, installDate, lifespan, manualCondition, media}) {
      let icon = '⚪'
      let subtitle = 'Keine Daten'

      if (installDate && lifespan) {
        const installed = new Date(installDate).getFullYear()
        const now = new Date().getFullYear()
        const age = now - installed
        const remaining = Math.max(0, lifespan - age)
        const percentage = Math.round((remaining / lifespan) * 100)

        // Traffic Light Logic
        if (
          manualCondition === 'critical' ||
          manualCondition === 'defect' ||
          percentage < 20
        ) {
          icon = '🔴'
        } else if (manualCondition === 'worn' || percentage < 50) {
          icon = '🟡'
        } else {
          icon = '🟢'
        }

        subtitle = `Alter: ${age}J · Rest: ${remaining}J (${percentage}%)`
      }

      return {
        title: `${icon} ${title || 'Unbenannt'}`,
        subtitle,
        media: media || Package,
      }
    },
  },
})
