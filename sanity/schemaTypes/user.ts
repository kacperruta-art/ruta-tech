import {defineType, defineField, defineArrayMember} from 'sanity'
import {User, Home, Car, Key, Settings, ShieldCheck} from 'lucide-react'

export const user = defineType({
  name: 'user',
  title: 'Benutzer',
  type: 'document',
  icon: User,
  groups: [
    {name: 'identity', title: 'Identitaet', default: true},
    {name: 'residence', title: 'Wohnen & Objekte', icon: Home},
    {name: 'mobility', title: 'Mobilitaet & Parking', icon: Car},
    {name: 'access', title: 'Zugang & Schluessel', icon: Key},
    {name: 'settings', title: 'Einstellungen', icon: Settings},
  ],
  fields: [
    // === Group: identity ===
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{type: 'tenant'}],
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'systemRole',
      title: 'Systemrolle',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          {title: 'Mieter / Bewohner', value: 'tenant'},
          {title: 'Eigentuemer', value: 'owner'},
          {title: 'Hauswart / FM', value: 'caretaker'},
          {title: 'Verwalter', value: 'manager'},
          {title: 'Dienstleister', value: 'provider'},
          {title: 'Administrator', value: 'admin'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Account Status',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          {title: 'Aktiv', value: 'active'},
          {title: 'Eingeladen (Pending)', value: 'invited'},
          {title: 'Deaktiviert', value: 'inactive'},
        ],
      },
      initialValue: 'invited',
    }),
    defineField({
      name: 'authId',
      title: 'Auth Provider ID',
      type: 'string',
      group: 'identity',
      description:
        'Verknuepfung zum Login-Provider (z.B. Supabase/Auth0 UID).',
      readOnly: true,
    }),
    defineField({
      name: 'firstName',
      title: 'Vorname',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Nachname',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'E-Mail',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Mobilnummer',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'avatar',
      title: 'Profilbild',
      type: 'image',
      group: 'identity',
      options: {hotspot: true},
    }),

    // === Group: residence (The "House" Link) ===
    defineField({
      name: 'rentedUnits',
      title: 'Gemietete Objekte (Wohnungen)',
      type: 'array',
      group: 'residence',
      description: 'Welche Einheiten bewohnt dieser User?',
      of: [{type: 'reference', to: [{type: 'unit'}]}],
    }),
    defineField({
      name: 'isMainTenant',
      title: 'Ist Hauptmieter?',
      type: 'boolean',
      group: 'residence',
      initialValue: true,
      description:
        'Falls deaktiviert, handelt es sich um einen Mitbewohner/Partner.',
    }),

    // === Group: mobility (The "Garage" Link) ===
    defineField({
      name: 'rentedParkingSpots',
      title: 'Parkplaetze',
      type: 'array',
      group: 'mobility',
      description: 'Zugeordnete Parkplaetze oder Garagenboxen.',
      of: [{type: 'reference', to: [{type: 'parkingSpot'}]}],
    }),
    defineField({
      name: 'vehicles',
      title: 'Fahrzeuge',
      type: 'array',
      group: 'mobility',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'plate',
              title: 'Kennzeichen',
              type: 'string',
            }),
            defineField({
              name: 'model',
              title: 'Marke/Modell',
              type: 'string',
            }),
          ],
          preview: {
            select: {title: 'plate', subtitle: 'model'},
          },
        }),
      ],
    }),

    // === Group: access (Keys & Smart Assets) ===
    defineField({
      name: 'assignedAssets',
      title: 'Persoenliche Assets / Geraete',
      type: 'array',
      group: 'access',
      description:
        'Spezifische Geraete, auf die nur dieser User Zugriff hat (z.B. Private Wallbox).',
      of: [{type: 'reference', to: [{type: 'asset'}]}],
    }),
    defineField({
      name: 'digitalKeys',
      title: 'Digitale Schluessel (Badges)',
      type: 'array',
      group: 'access',
      of: [
        defineArrayMember({
          type: 'object',
          icon: Key,
          fields: [
            defineField({
              name: 'keyId',
              title: 'Schluessel-ID / Chip-Nr.',
              type: 'string',
            }),
            defineField({
              name: 'label',
              title: 'Bezeichnung',
              type: 'string',
            }),
            defineField({
              name: 'active',
              title: 'Aktiv',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'keyId', active: 'active'},
            prepare({title, subtitle, active}) {
              return {
                title: title || 'Schluessel',
                subtitle: subtitle,
                media: active ? ShieldCheck : Key,
              }
            },
          },
        }),
      ],
    }),

    // === Group: settings ===
    defineField({
      name: 'language',
      title: 'Bevorzugte Sprache',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Deutsch', value: 'de'},
          {title: 'Franzoesisch', value: 'fr'},
          {title: 'Italienisch', value: 'it'},
          {title: 'Englisch', value: 'en'},
        ],
      },
      initialValue: 'de',
    }),
    defineField({
      name: 'communicationPreferences',
      title: 'Benachrichtigungen',
      type: 'object',
      group: 'settings',
      fields: [
        defineField({
          name: 'email',
          title: 'Per E-Mail',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'sms',
          title: 'Per SMS (Dringend)',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'push',
          title: 'Push-Notifikation',
          type: 'boolean',
          initialValue: true,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      first: 'firstName',
      last: 'lastName',
      role: 'systemRole',
      unit: 'rentedUnits.0.name',
      media: 'avatar',
    },
    prepare({first, last, role, unit, media}) {
      const roleLabels: Record<string, string> = {
        tenant: 'Mieter',
        owner: 'Eigentuemer',
        caretaker: 'Hauswart',
        manager: 'Verwalter',
        provider: 'Dienstleister',
        admin: 'Admin',
      }
      return {
        title: [first, last].filter(Boolean).join(' ') || 'Unbenannt',
        subtitle: `${roleLabels[role] || role || ''} · ${unit || 'Kein Objekt'}`,
        media: media || User,
      }
    },
  },
})
