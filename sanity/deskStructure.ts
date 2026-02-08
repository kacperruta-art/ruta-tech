import type {
  DefaultDocumentNodeResolver,
  StructureResolver,
} from 'sanity/structure'
import {
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  Users,
  Home,
  Building2,
  Layers,
  Box,
  Car,
  FileText,
  BookOpen,
  DoorOpen,
  Trees,
  CalendarClock,
  CircleParking,
  Gauge,
  Activity,
} from 'lucide-react'
import {QRGenerator} from './components/QRGenerator'
import {ServiceHistoryView} from './components/ServiceHistoryView'
import {HealthBar} from './components/HealthBar'

// Schema types that get the "Service-Historie" tab
const TYPES_WITH_HISTORY = [
  'property',
  'building',
  'floor',
  'unit',
  'asset',
  'parkingFacility',
  'outdoorArea',
]

// Container types that show the batch QR grid
const CONTAINER_TYPES = [
  'property', 'building', 'floor', 'unit', 'parkingFacility', 'outdoorArea',
]

// Leaf types that show a single QR code
const LEAF_QR_TYPES = ['asset', 'parkingSpot']

// Shared helper: builds the views array for any schema type.
// Used by BOTH defaultDocumentNode AND explicit S.document() nodes in the tree.
function getDocumentViews(S: any, schemaType: string) {
  const views = [S.view.form().title('Bearbeiten')]

  // Asset-specific: Health & PAL tab
  if (schemaType === 'asset') {
    views.push(
      S.view.component(HealthBar).title('Health & PAL').icon(Activity)
    )
  }

  if (CONTAINER_TYPES.includes(schemaType)) {
    views.push(S.view.component(QRGenerator).title('QR Codes Liste'))
  } else if (LEAF_QR_TYPES.includes(schemaType)) {
    views.push(S.view.component(QRGenerator).title('QR Code'))
  }

  if (TYPES_WITH_HISTORY.includes(schemaType)) {
    views.push(
      S.view.component(ServiceHistoryView).title('Service-Historie').icon(Clock)
    )
  }

  return views
}

// --- 1. SPLIT VIEW CONFIGURATION (Form + QR Code + Service-Historie) ---
// Applied automatically when documents are opened from S.documentTypeList / S.documentList
// WITHOUT a custom .child() returning S.document().
export const defaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  {schemaType}
) => {
  return S.document().views(getDocumentViews(S, schemaType))
}

// --- 2. MAIN MENU STRUCTURE ---
export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('ImmoAdmin')
    .items([
      // === A. SERVICE CENTER (Workflow) ===
      S.listItem()
        .title('Service-Center')
        .icon(ClipboardList)
        .id('service-center')
        .child(
          S.list()
            .id('service-center-menu')
            .title('Auftrags-Status')
            .items([
              // ── Unified Status Views (Tickets + Logbook) ────────
              S.listItem()
                .title('Offen')
                .icon(AlertCircle)
                .id('logbook-open')
                .child(
                  S.documentList()
                    .id('logbook-open-list')
                    .title('Offene Auftraege')
                    .filter(
                      '(_type == "logbookEntry" && status == "open") || ' +
                      '(_type == "ticket" && status in ["pending_approval", "approved"])'
                    )
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                ),
              S.listItem()
                .title('In Arbeit')
                .icon(Clock)
                .id('logbook-in-progress')
                .child(
                  S.documentList()
                    .id('logbook-in-progress-list')
                    .title('In Arbeit')
                    .filter(
                      '(_type == "logbookEntry" && status == "in_progress") || ' +
                      '(_type == "ticket" && status == "in_progress")'
                    )
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                ),
              S.listItem()
                .title('Erledigt')
                .icon(CheckCircle2)
                .id('logbook-done')
                .child(
                  S.documentList()
                    .id('logbook-done-list')
                    .title('Erledigte Auftraege')
                    .filter(
                      '(_type == "logbookEntry" && status == "done") || ' +
                      '(_type == "ticket" && status == "completed")'
                    )
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                ),
              S.divider(),
              S.listItem()
                .title('Alle Tickets')
                .icon(FileText)
                .id('all-tickets')
                .child(S.documentTypeList('ticket').id('all-tickets-list')),
              S.listItem()
                .title('Alle Eintraege')
                .icon(BookOpen)
                .id('all-logbook')
                .child(S.documentTypeList('logbookEntry').id('all-logbook-list')),
              S.divider(),
              S.listItem()
                .title('Wartung & Intervalle')
                .icon(CalendarClock)
                .id('maintenance')
                .child(
                  S.documentTypeList('maintenancePlan')
                    .id('maintenance-list')
                    .title('Wartungsplaene')
                    .defaultOrdering([{field: 'nextDueDate', direction: 'asc'}])
                ),
              S.listItem()
                .title('Zaehlerstande')
                .icon(Gauge)
                .id('meter-readings')
                .child(
                  S.documentTypeList('meterReading')
                    .id('meter-readings-list')
                    .title('Zaehlerstande')
                    .defaultOrdering([{field: 'date', direction: 'desc'}])
                ),
            ])
        ),

      S.divider(),

      // === B. EXPLORER (The Drill-Down Tree) ===
      S.listItem()
        .title('Explorer')
        .icon(LayoutDashboard)
        .id('explorer')
        .child(
          S.documentTypeList('tenant')
            .id('tenants-list')
            .title('Mandanten')
            .schemaType('tenant')
            .child((tenantId) =>
              S.list()
                .id(`tenant-menu-${tenantId}`)
                .title('Mandant Details')
                .items([
                  // 1. Edit Tenant
                  S.listItem()
                    .title('Mandant bearbeiten')
                    .icon(Users)
                    .id(`edit-tenant-${tenantId}`)
                    .child(
                      S.document()
                        .schemaType('tenant')
                        .documentId(tenantId)
                    ),

                  // 2. Properties (Drill-down start)
                  S.listItem()
                    .title('Liegenschaften')
                    .icon(Home)
                    .id(`properties-item-${tenantId}`)
                    .child(
                      S.documentList()
                        .id(`properties-${tenantId}`)
                        .title('Liegenschaften')
                        .schemaType('property')
                        .filter(
                          '_type == "property" && tenant._ref == $tenantId'
                        )
                        .params({tenantId})
                        .initialValueTemplates([
                          S.initialValueTemplateItem('property-by-tenant', {tenantId}),
                        ])
                        .child((propertyId) =>
                          S.list()
                            .id(`property-menu-${propertyId}`)
                            .title('Objekt-Struktur')
                            .items([
                              S.listItem()
                                .title('Liegenschaft bearbeiten')
                                .icon(Home)
                                .id(`edit-property-${propertyId}`)
                                .child(
                                  S.document()
                                    .schemaType('property')
                                    .documentId(propertyId)
                                    .views(getDocumentViews(S, 'property'))
                                ),

                              // Buildings
                              S.listItem()
                                .title('Gebaeude')
                                .icon(Building2)
                                .id(`buildings-item-${propertyId}`)
                                .child(
                                  S.documentList()
                                    .id(`buildings-${propertyId}`)
                                    .title('Gebaeude')
                                    .schemaType('building')
                                    .filter(
                                      '_type == "building" && property._ref == $propertyId'
                                    )
                                    .params({propertyId})
                                    .initialValueTemplates([
                                      S.initialValueTemplateItem('building-by-property', {
                                        propertyId,
                                        tenantId,
                                      }),
                                    ])
                                    .child((buildingId) =>
                                      S.list()
                                        .id(`building-menu-${buildingId}`)
                                        .title('Gebaeude-Struktur')
                                        .items([
                                          S.listItem()
                                            .title('Gebaeude bearbeiten')
                                            .icon(Building2)
                                            .id(`edit-building-${buildingId}`)
                                            .child(
                                              S.document()
                                                .schemaType('building')
                                                .documentId(buildingId)
                                                .views(getDocumentViews(S, 'building'))
                                            ),

                                          // Floors
                                          S.listItem()
                                            .title('Stockwerke')
                                            .icon(Layers)
                                            .id(`floors-item-${buildingId}`)
                                            .child(
                                              S.documentList()
                                                .id(`floors-${buildingId}`)
                                                .title('Stockwerke')
                                                .schemaType('floor')
                                                .filter(
                                                  '_type == "floor" && building._ref == $buildingId'
                                                )
                                                .params({buildingId})
                                                .initialValueTemplates([
                                                  S.initialValueTemplateItem('floor-by-building', {
                                                    buildingId,
                                                    tenantId,
                                                  }),
                                                ])
                                                .child((floorId) =>
                                                  S.list()
                                                    .id(`floor-menu-${floorId}`)
                                                    .title('Stockwerk')
                                                    .items([
                                                      S.listItem()
                                                        .title(
                                                          'Stockwerk bearbeiten'
                                                        )
                                                        .icon(Layers)
                                                        .id(`edit-floor-${floorId}`)
                                                        .child(
                                                          S.document()
                                                            .schemaType('floor')
                                                            .documentId(floorId)
                                                            .views(getDocumentViews(S, 'floor'))
                                                        ),
                                                      S.listItem()
                                                        .title('Einheiten')
                                                        .icon(DoorOpen)
                                                        .id(`units-item-${floorId}`)
                                                        .child(
                                                          S.documentList()
                                                            .id(`units-${floorId}`)
                                                            .title('Einheiten')
                                                            .schemaType('unit')
                                                            .filter(
                                                              '_type == "unit" && floor._ref == $floorId'
                                                            )
                                                            .params({floorId})
                                                            .initialValueTemplates([
                                                              S.initialValueTemplateItem('unit-by-floor', {
                                                                floorId,
                                                                buildingId,
                                                                tenantId,
                                                              }),
                                                            ])
                                                            .child((unitId) =>
                                                              S.list()
                                                                .id(`unit-menu-${unitId}`)
                                                                .title('Einheit Details')
                                                                .items([
                                                                  S.listItem()
                                                                    .title('Einheit bearbeiten')
                                                                    .icon(DoorOpen)
                                                                    .id(`edit-unit-${unitId}`)
                                                                    .child(
                                                                      S.document()
                                                                        .schemaType('unit')
                                                                        .documentId(unitId)
                                                                        .views(getDocumentViews(S, 'unit'))
                                                                    ),
                                                                  S.listItem()
                                                                    .title('Assets (Wohnung)')
                                                                    .icon(Box)
                                                                    .id(`assets-unit-item-${unitId}`)
                                                                    .child(
                                                                      S.documentTypeList('asset')
                                                                        .id(`assets-unit-${unitId}`)
                                                                        .title('Assets (Wohnung)')
                                                                        .filter(
                                                                          '_type == "asset" && location._ref == $unitId'
                                                                        )
                                                                        .params({unitId})
                                                                        .initialValueTemplates([
                                                                          S.initialValueTemplateItem('asset-by-unit', {
                                                                            unitId,
                                                                            tenantId,
                                                                          }),
                                                                        ])
                                                                    ),
                                                                  S.listItem()
                                                                    .title('Tickets (Wohnung)')
                                                                    .icon(FileText)
                                                                    .id(`tickets-unit-item-${unitId}`)
                                                                    .child(
                                                                      S.documentList()
                                                                        .id(`tickets-unit-${unitId}`)
                                                                        .title('Tickets')
                                                                        .schemaType('ticket')
                                                                        .filter(
                                                                          '_type == "ticket" && scope._ref == $unitId'
                                                                        )
                                                                        .params({unitId})
                                                                    ),
                                                                ])
                                                            )
                                                        ),
                                                      S.listItem()
                                                        .title(
                                                          'Assets (Etage)'
                                                        )
                                                        .icon(Box)
                                                        .id(`assets-floor-item-${floorId}`)
                                                        .child(
                                                          S.documentList()
                                                            .id(`assets-floor-${floorId}`)
                                                            .title(
                                                              'Assets (Etage)'
                                                            )
                                                            .schemaType('asset')
                                                            .filter(
                                                              '_type == "asset" && location._ref == $floorId'
                                                            )
                                                            .params({floorId})
                                                        ),
                                                    ])
                                                )
                                            ),

                                          // Assets at building level
                                          S.listItem()
                                            .title('Assets (Gebaeude)')
                                            .icon(Box)
                                            .id(`assets-building-item-${buildingId}`)
                                            .child(
                                              S.documentList()
                                                .id(`assets-building-${buildingId}`)
                                                .title('Assets (Gebaeude)')
                                                .schemaType('asset')
                                                .filter(
                                                  '_type == "asset" && location._ref == $buildingId'
                                                )
                                                .params({buildingId})
                                            ),
                                        ])
                                    )
                                ),

                              // Parking Facilities (Drill-down)
                              S.listItem()
                                .title('Parkanlagen')
                                .icon(Car)
                                .id(`parking-item-${propertyId}`)
                                .child(
                                  S.documentList()
                                    .id(`parking-${propertyId}`)
                                    .title('Parkanlagen')
                                    .schemaType('parkingFacility')
                                    .filter(
                                      '_type == "parkingFacility" && property._ref == $propertyId'
                                    )
                                    .params({propertyId})
                                    .child((facilityId) =>
                                      S.list()
                                        .id(`facility-menu-${facilityId}`)
                                        .title('Verwaltung Parkanlage')
                                        .items([
                                          S.listItem()
                                            .title('Anlage bearbeiten')
                                            .icon(Car)
                                            .id(`edit-facility-${facilityId}`)
                                            .child(
                                              S.document()
                                                .schemaType('parkingFacility')
                                                .documentId(facilityId)
                                                .views(getDocumentViews(S, 'parkingFacility'))
                                            ),
                                          S.listItem()
                                            .title('Parkplaetze')
                                            .icon(CircleParking)
                                            .id(`spots-item-${facilityId}`)
                                            .child(
                                              S.documentList()
                                                .id(`spots-${facilityId}`)
                                                .title('Parkplaetze')
                                                .schemaType('parkingSpot')
                                                .filter(
                                                  '_type == "parkingSpot" && facility._ref == $facilityId'
                                                )
                                                .params({facilityId})
                                                .initialValueTemplates([
                                                  S.initialValueTemplateItem('spot-by-facility', {
                                                    facilityId,
                                                  }),
                                                ])
                                                .defaultOrdering([
                                                  {field: 'number', direction: 'asc'},
                                                ])
                                            ),
                                          S.listItem()
                                            .title('Tickets')
                                            .icon(AlertCircle)
                                            .id(`tickets-facility-item-${facilityId}`)
                                            .child(
                                              S.documentList()
                                                .id(`tickets-facility-${facilityId}`)
                                                .title('Tickets')
                                                .schemaType('ticket')
                                                .filter(
                                                  '_type == "ticket" && scope._ref == $facilityId'
                                                )
                                                .params({facilityId})
                                            ),
                                        ])
                                    )
                                ),

                              // Outdoor Areas
                              S.listItem()
                                .title('Aussenanlagen')
                                .icon(Trees)
                                .id(`outdoor-item-${propertyId}`)
                                .child(
                                  S.documentList()
                                    .id(`outdoor-${propertyId}`)
                                    .title('Aussenanlagen')
                                    .schemaType('outdoorArea')
                                    .filter(
                                      '_type == "outdoorArea" && property._ref == $propertyId'
                                    )
                                    .params({propertyId})
                                    .child((outdoorAreaId) =>
                                      S.list()
                                        .id(`outdoor-menu-${outdoorAreaId}`)
                                        .title('Bereich')
                                        .items([
                                          S.listItem()
                                            .title('Bearbeiten')
                                            .icon(Trees)
                                            .id(`edit-outdoor-${outdoorAreaId}`)
                                            .child(
                                              S.document()
                                                .schemaType('outdoorArea')
                                                .documentId(outdoorAreaId)
                                                .views(getDocumentViews(S, 'outdoorArea'))
                                            ),
                                          S.listItem()
                                            .title('Assets (In diesem Bereich)')
                                            .icon(Box)
                                            .id(`assets-outdoor-item-${outdoorAreaId}`)
                                            .child(
                                              S.documentList()
                                                .id(`assets-outdoor-${outdoorAreaId}`)
                                                .title('Assets')
                                                .schemaType('asset')
                                                .filter(
                                                  '_type == "asset" && location._ref == $outdoorAreaId'
                                                )
                                                .params({outdoorAreaId})
                                                .initialValueTemplates([
                                                  S.initialValueTemplateItem('asset-by-outdoor', {
                                                    outdoorId: outdoorAreaId,
                                                    tenantId,
                                                  }),
                                                ])
                                            ),
                                          S.listItem()
                                            .title('Tickets')
                                            .icon(FileText)
                                            .id(`tickets-outdoor-item-${outdoorAreaId}`)
                                            .child(
                                              S.documentList()
                                                .id(`tickets-outdoor-${outdoorAreaId}`)
                                                .title('Tickets')
                                                .schemaType('ticket')
                                                .filter(
                                                  '_type == "ticket" && scope._ref == $outdoorAreaId'
                                                )
                                                .params({outdoorAreaId})
                                            ),
                                        ])
                                    )
                                ),

                              // Assets at property level
                              S.listItem()
                                .title('Assets (Areal)')
                                .icon(Box)
                                .id(`assets-property-item-${propertyId}`)
                                .child(
                                  S.documentList()
                                    .id(`assets-property-${propertyId}`)
                                    .title('Assets (Areal)')
                                    .schemaType('asset')
                                    .filter(
                                      '_type == "asset" && location._ref == $propertyId'
                                    )
                                    .params({propertyId})
                                ),
                            ])
                        )
                    ),

                  S.divider(),

                  S.listItem()
                    .title('Dienstleister')
                    .icon(Users)
                    .id(`providers-${tenantId}`)
                    .child(S.documentTypeList('provider').id(`providers-list-${tenantId}`)),
                  S.listItem()
                    .title('Benutzer')
                    .icon(Users)
                    .id(`users-${tenantId}`)
                    .child(S.documentTypeList('user').id(`users-list-${tenantId}`)),
                ])
            )
        ),

      S.divider(),

      // === C. FLAT LISTS (Fallback) ===
      S.documentTypeListItem('ticket').title('Tickets'),
      S.documentTypeListItem('asset').title('Assets'),
      S.documentTypeListItem('provider').title('Dienstleister'),

      // Catch-all for other types not listed above
      ...S.documentTypeListItems().filter(
        (listItem) =>
          ![
            'logbookEntry',
            'ticket',
            'property',
            'building',
            'floor',
            'unit',
            'parkingFacility',
            'parkingSpot',
            'outdoorArea',
            'maintenancePlan',
            'meterReading',
            'asset',
            'tenant',
            'provider',
            'user',
            'media.tag',
          ].includes(listItem.getId() || '')
      ),
    ])
