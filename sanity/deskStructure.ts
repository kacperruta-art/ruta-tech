import type { StructureResolver } from 'sanity/structure'
import {
  Building2,
  Wrench,
  User,
  MapPin,
  Home,
  Layers,
  DoorOpen,
  Car,
  ClipboardList,
  BookOpen,
  Package,
} from 'lucide-react'

// All document types explicitly listed in the sidebar.
// Used to filter them out of the auto-generated "rest" section.
const LISTED_TYPES = [
  'tenant',
  'provider',
  'user',
  'property',
  'building',
  'floor',
  'unit',
  'parkingFacility',
  'ticket',
  'logbookEntry',
  'asset',
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('RUTA // TECH')
    .items([
      // ── Organisation & Personen ──────────────────────
      S.listItem()
        .title('Mandanten')
        .icon(Building2)
        .child(S.documentTypeList('tenant').title('Mandanten')),

      S.listItem()
        .title('Dienstleister')
        .icon(Wrench)
        .child(S.documentTypeList('provider').title('Dienstleister')),

      S.listItem()
        .title('Benutzer')
        .icon(User)
        .child(S.documentTypeList('user').title('Benutzer')),

      // ── Immobilienstruktur ───────────────────────────
      S.divider(),

      S.listItem()
        .title('Liegenschaften / Areale')
        .icon(MapPin)
        .child(S.documentTypeList('property').title('Liegenschaften / Areale')),

      S.listItem()
        .title('Gebäude')
        .icon(Home)
        .child(S.documentTypeList('building').title('Gebäude')),

      S.listItem()
        .title('Ebenen & Zonen')
        .icon(Layers)
        .child(S.documentTypeList('floor').title('Ebenen & Zonen')),

      S.listItem()
        .title('Nutzungseinheiten')
        .icon(DoorOpen)
        .child(S.documentTypeList('unit').title('Nutzungseinheiten')),

      S.listItem()
        .title('Parkanlagen')
        .icon(Car)
        .child(S.documentTypeList('parkingFacility').title('Parkanlagen')),

      // ── Betrieb ──────────────────────────────────────
      S.divider(),

      S.listItem()
        .title('Tickets / Meldungen')
        .icon(ClipboardList)
        .child(S.documentTypeList('ticket').title('Tickets / Meldungen')),

      S.listItem()
        .title('Serviceheft')
        .icon(BookOpen)
        .child(S.documentTypeList('logbookEntry').title('Serviceheft')),

      // ── Inventar ─────────────────────────────────────
      S.divider(),

      S.listItem()
        .title('Anlagen & Inventar')
        .icon(Package)
        .child(S.documentTypeList('asset').title('Anlagen & Inventar')),

      // ── Remaining types (if any) ─────────────────────
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !LISTED_TYPES.includes(item.getId() ?? '')
      ),
    ])
