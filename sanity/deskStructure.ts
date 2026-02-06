import type {
  DefaultDocumentNodeResolver,
  StructureResolver,
} from 'sanity/structure'
import {
  Building2,
  Wrench,
  User,
  Users,
  MapPin,
  Home,
  Layers,
  DoorOpen,
  Car,
  Ticket,
  BookOpen,
  Package,
  Pencil,
  FolderTree,
  Upload,
  QrCode,
  Briefcase,
} from 'lucide-react'

import { QRGenerator } from './components/QRGenerator'
import { MassImport } from './components/MassImport'

// ── Type alias for brevity ───────────────────────────────
type SB = Parameters<StructureResolver>[0]

// Types that get the "QR Inventory" tab
const QR_INVENTORY_TYPES = ['property', 'building', 'floor', 'unit', 'parkingFacility']

// All types handled in the sidebar (used to hide auto-generated duplicates)
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

// ── View helpers ─────────────────────────────────────────

/** Build the correct view tabs for a given schema type */
function viewsFor(S: SB, schemaType: string) {
  if (schemaType === 'tenant') {
    return [
      S.view.form(),
      S.view.component(MassImport).title('Mass Import').icon(Upload),
    ]
  }
  if (schemaType === 'asset') {
    return [
      S.view.form(),
      S.view.component(QRGenerator).title('QR Code').icon(QrCode),
    ]
  }
  if (QR_INVENTORY_TYPES.includes(schemaType)) {
    return [
      S.view.form(),
      S.view.component(QRGenerator).title('QR Export').icon(QrCode),
    ]
  }
  return [S.view.form()]
}

/** Create an "Edit" document node with proper view tabs */
function editNode(S: SB, id: string, schemaType: string) {
  return S.document()
    .documentId(id)
    .schemaType(schemaType)
    .views(viewsFor(S, schemaType))
}

// ── Level 4: Floor ───────────────────────────────────────

function floorView(S: SB, floorId: string) {
  return S.list()
    .title('Ebene')
    .items([
      S.listItem()
        .title('Ebene bearbeiten')
        .icon(Pencil)
        .child(editNode(S, floorId, 'floor')),

      S.listItem()
        .title('Nutzungseinheiten')
        .icon(DoorOpen)
        .child(
          S.documentTypeList('unit')
            .title('Nutzungseinheiten')
            .filter('_type == "unit" && floor._ref == $floorId')
            .params({ floorId })
            .child((unitId) =>
              S.list()
                .title('Einheit')
                .items([
                  S.listItem()
                    .title('Einheit bearbeiten')
                    .icon(Pencil)
                    .child(editNode(S, unitId, 'unit')),

                  S.listItem()
                    .title('Assets in Einheit')
                    .icon(Package)
                    .child(
                      S.documentTypeList('asset')
                        .title('Assets in Einheit')
                        .filter('_type == "asset" && location._ref == $unitId')
                        .params({ unitId })
                    ),
                ])
            )
        ),

      S.listItem()
        .title('Assets auf Ebene')
        .icon(Package)
        .child(
          S.documentTypeList('asset')
            .title('Assets auf Ebene')
            .filter('_type == "asset" && location._ref == $floorId')
            .params({ floorId })
        ),
    ])
}

// ── Level 3: Building ────────────────────────────────────

function buildingView(S: SB, buildingId: string) {
  return S.list()
    .title('Gebäude')
    .items([
      S.listItem()
        .title('Gebäude bearbeiten')
        .icon(Pencil)
        .child(editNode(S, buildingId, 'building')),

      S.listItem()
        .title('Ebenen / Stockwerke')
        .icon(Layers)
        .child(
          S.documentTypeList('floor')
            .title('Ebenen / Stockwerke')
            .filter('_type == "floor" && building._ref == $buildingId')
            .params({ buildingId })
            .child((floorId) => floorView(S, floorId))
        ),

      S.listItem()
        .title('Direkte Assets (Gebäude)')
        .icon(Package)
        .child(
          S.documentTypeList('asset')
            .title('Direkte Assets')
            .filter('_type == "asset" && location._ref == $buildingId')
            .params({ buildingId })
        ),
    ])
}

// ── Level 2: Property ────────────────────────────────────

function propertyView(S: SB, propertyId: string) {
  return S.list()
    .title('Liegenschaft')
    .items([
      S.listItem()
        .title('Liegenschaft bearbeiten')
        .icon(Pencil)
        .child(editNode(S, propertyId, 'property')),

      S.listItem()
        .title('Gebäude')
        .icon(Home)
        .child(
          S.documentTypeList('building')
            .title('Gebäude')
            .filter('_type == "building" && property._ref == $propertyId')
            .params({ propertyId })
            .child((buildingId) => buildingView(S, buildingId))
        ),

      S.listItem()
        .title('Garagen / Parkanlagen')
        .icon(Car)
        .child(
          S.documentTypeList('parkingFacility')
            .title('Garagen / Parkanlagen')
            .filter('_type == "parkingFacility" && property._ref == $propertyId')
            .params({ propertyId })
            .child((parkingId) =>
              S.list()
                .title('Parkanlage')
                .items([
                  S.listItem()
                    .title('Parkanlage bearbeiten')
                    .icon(Pencil)
                    .child(editNode(S, parkingId, 'parkingFacility')),

                  S.listItem()
                    .title('Assets in Parkanlage')
                    .icon(Package)
                    .child(
                      S.documentTypeList('asset')
                        .title('Assets in Parkanlage')
                        .filter('_type == "asset" && location._ref == $parkingId')
                        .params({ parkingId })
                    ),
                ])
            )
        ),

      S.listItem()
        .title('Direkte Assets (Areal)')
        .icon(Package)
        .child(
          S.documentTypeList('asset')
            .title('Direkte Assets')
            .filter('_type == "asset" && location._ref == $propertyId')
            .params({ propertyId })
        ),
    ])
}

// ── Level 1: Tenant ──────────────────────────────────────

function tenantView(S: SB, tenantId: string) {
  return S.list()
    .title('Mandant')
    .items([
      S.listItem()
        .title('Mandant bearbeiten')
        .icon(Pencil)
        .child(editNode(S, tenantId, 'tenant')),

      S.listItem()
        .title('Liegenschaften')
        .icon(Building2)
        .child(
          S.documentTypeList('property')
            .title('Liegenschaften')
            .filter('_type == "property" && tenant._ref == $tenantId')
            .params({ tenantId })
            .child((propertyId) => propertyView(S, propertyId))
        ),

      S.listItem()
        .title('Dienstleister')
        .icon(Briefcase)
        .child(
          S.documentTypeList('provider')
            .title('Dienstleister')
            .filter('_type == "provider" && tenant._ref == $tenantId')
            .params({ tenantId })
            .initialValueTemplates([
              S.initialValueTemplateItem('provider-by-tenant', { tenantId }),
            ])
        ),

      S.listItem()
        .title('Benutzer')
        .icon(Users)
        .child(
          S.documentTypeList('user')
            .title('Benutzer')
            .filter('_type == "user" && tenant._ref == $tenantId')
            .params({ tenantId })
            .initialValueTemplates([
              S.initialValueTemplateItem('user-by-tenant', { tenantId }),
            ])
        ),
    ])
}

// ── Root Structure ───────────────────────────────────────

export const structure: StructureResolver = (S) =>
  S.list()
    .title('RUTA // TECH')
    .items([
      // ── Hierarchical Explorer ────────────────────────
      S.listItem()
        .title('Explorer')
        .icon(FolderTree)
        .child(
          S.documentTypeList('tenant')
            .title('Mandanten')
            .child((tenantId) => tenantView(S, tenantId))
        ),

      // ── Global Data / Admin ──────────────────────────
      S.divider(),

      S.listItem()
        .title('Dienstleister')
        .icon(Briefcase)
        .child(S.documentTypeList('provider').title('Dienstleister')),

      S.listItem()
        .title('Benutzer')
        .icon(Users)
        .child(S.documentTypeList('user').title('Benutzer')),

      S.divider(),

      S.listItem()
        .title('Tickets')
        .icon(Ticket)
        .child(S.documentTypeList('ticket').title('Tickets')),

      S.listItem()
        .title('Serviceheft')
        .icon(BookOpen)
        .child(S.documentTypeList('logbookEntry').title('Serviceheft')),

      S.divider(),

      S.listItem()
        .title('Anlagen & Inventar')
        .icon(Package)
        .child(S.documentTypeList('asset').title('Anlagen & Inventar')),

      // ── Remaining auto-generated types ───────────────
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !LISTED_TYPES.includes(item.getId() ?? '')
      ),
    ])

// ── Default Document Node (applies to flat admin lists) ──

export const defaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  { schemaType }
) => {
  if (schemaType === 'tenant') {
    return S.document().views([
      S.view.form(),
      S.view.component(MassImport).title('Mass Import').icon(Upload),
    ])
  }
  if (schemaType === 'asset') {
    return S.document().views([
      S.view.form(),
      S.view.component(QRGenerator).title('QR Code').icon(QrCode),
    ])
  }
  if (QR_INVENTORY_TYPES.includes(schemaType)) {
    return S.document().views([
      S.view.form(),
      S.view.component(QRGenerator).title('QR Export').icon(QrCode),
    ])
  }
  return S.document()
}
