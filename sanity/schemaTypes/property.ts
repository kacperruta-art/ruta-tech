import {defineType, defineField} from 'sanity'
import {MapPin, FileText, Shield, Users} from 'lucide-react'

export const property = defineType({
  name: 'property',
  title: 'Liegenschaft',
  type: 'document',
  icon: MapPin,
  groups: [
    {name: 'general', title: 'Basisdaten', default: true},
    {name: 'admin', title: 'Verwaltung & Register', icon: FileText},
    {name: 'insurance', title: 'Versicherung', icon: Shield},
    {name: 'team', title: 'Team & Zuständigkeit', icon: Users},
  ],
  fields: [
    // --- 1. BASISDATEN ---
    defineField({
      name: 'tenant',
      title: 'Mandant',
      type: 'reference',
      to: [{type: 'tenant'}],
      group: 'general',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Bezeichnung der Liegenschaft',
      type: 'string',
      group: 'general',
      description: 'z.B. "Wohnsiedlung Sonnenpark"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'general',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'geoBounds',
      title: 'Geo-Standort (Zentralpunkt)',
      type: 'geopoint',
      group: 'general',
    }),

    // --- 2. TEAM ---
    defineField({
      name: 'manager',
      title: 'Bewirtschafter (Büro)',
      type: 'reference',
      to: [{type: 'user'}],
      group: 'team',
      description: 'Zuständig für Verträge und Administration.',
    }),
    defineField({
      name: 'caretaker',
      title: 'Hauswart (Vor Ort)',
      type: 'reference',
      to: [{type: 'user'}],
      group: 'team',
      description: 'Zuständig für technische Anliegen vor Ort.',
    }),

    // --- 3. VERWALTUNG & REGISTER ---
    defineField({
      name: 'constructionYear',
      title: 'Baujahr (Areal)',
      type: 'number',
      group: 'admin',
    }),
    defineField({
      name: 'catasterNumber',
      title: 'Kataster-Nr. / Parzelle',
      type: 'string',
      group: 'admin',
    }),
    defineField({
      name: 'egrid',
      title: 'E-GRID (Eidg. Gebäude-ID)',
      type: 'string',
      group: 'admin',
    }),

    // --- 4. VERSICHERUNG ---
    defineField({
      name: 'insuranceCompany',
      title: 'Gebäudeversicherung',
      type: 'string',
      group: 'insurance',
      description: 'z.B. GVZ, AXA, Mobiliar',
    }),
    defineField({
      name: 'insurancePolicy',
      title: 'Policen-Nummer',
      type: 'string',
      group: 'insurance',
    }),

    // --- GLOBALE DIENSTE ---
    defineField({
      name: 'globalServices',
      title: 'Globale Dienstleistungen',
      type: 'array',
      group: 'general',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'serviceName',
              title: 'Dienstleistung',
              type: 'string',
            }),
            defineField({
              name: 'description',
              title: 'Beschreibung',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: {title: 'serviceName'},
          },
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'name', manager: 'manager.lastName'},
    prepare({title, manager}) {
      return {
        title: title,
        subtitle: manager ? `Verwaltung: ${manager}` : 'Kein Verwalter',
      }
    },
  },
})
