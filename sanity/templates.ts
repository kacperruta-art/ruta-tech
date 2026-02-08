// ── Initial Value Templates ──────────────────────────────
// These templates pre-fill parent references when creating
// documents inside the Explorer drill-down tree.
// Without them, new documents lose context and vanish from
// the filtered list, crashing the Studio back to root.

import type {Template} from 'sanity'

type Ref = {_type: 'reference'; _ref: string}
function ref(id: string): Ref {
  return {_type: 'reference', _ref: id}
}

export const contextTemplates: Template[] = [
  // ── Tenant-scoped creation ────────────────────────────

  {
    id: 'property-by-tenant',
    title: 'Liegenschaft (Mandant)',
    schemaType: 'property',
    parameters: [{name: 'tenantId', type: 'string'}],
    value: ({tenantId}: {tenantId: string}) => ({
      tenant: ref(tenantId),
    }),
  },

  {
    id: 'provider-by-tenant',
    title: 'Dienstleister (Mandant)',
    schemaType: 'provider',
    parameters: [{name: 'tenantId', type: 'string'}],
    value: ({tenantId}: {tenantId: string}) => ({
      tenant: ref(tenantId),
    }),
  },

  {
    id: 'user-by-tenant',
    title: 'Benutzer (Mandant)',
    schemaType: 'user',
    parameters: [{name: 'tenantId', type: 'string'}],
    value: ({tenantId}: {tenantId: string}) => ({
      tenant: ref(tenantId),
    }),
  },

  // ── Hierarchy: Property -> Building ────────────────────

  {
    id: 'building-by-property',
    title: 'Gebaeude in Liegenschaft',
    schemaType: 'building',
    parameters: [
      {name: 'propertyId', type: 'string'},
      {name: 'tenantId', type: 'string'},
    ],
    value: ({propertyId, tenantId}: {propertyId: string; tenantId: string}) => ({
      property: ref(propertyId),
      tenant: ref(tenantId),
    }),
  },

  // ── Hierarchy: Building -> Floor ───────────────────────

  {
    id: 'floor-by-building',
    title: 'Stockwerk in Gebaeude',
    schemaType: 'floor',
    parameters: [
      {name: 'buildingId', type: 'string'},
      {name: 'tenantId', type: 'string'},
    ],
    value: ({buildingId, tenantId}: {buildingId: string; tenantId: string}) => ({
      building: ref(buildingId),
      tenant: ref(tenantId),
    }),
  },

  // ── Hierarchy: Floor -> Unit ───────────────────────────

  {
    id: 'unit-by-floor',
    title: 'Einheit auf Stockwerk',
    schemaType: 'unit',
    parameters: [
      {name: 'floorId', type: 'string'},
      {name: 'buildingId', type: 'string'},
      {name: 'tenantId', type: 'string'},
    ],
    value: ({floorId, buildingId, tenantId}: {floorId: string; buildingId: string; tenantId: string}) => ({
      floor: ref(floorId),
      building: ref(buildingId),
      tenant: ref(tenantId),
    }),
  },

  // ── Hierarchy: Unit -> Asset ───────────────────────────

  {
    id: 'asset-by-unit',
    title: 'Asset in Einheit',
    schemaType: 'asset',
    parameters: [
      {name: 'unitId', type: 'string'},
      {name: 'tenantId', type: 'string'},
    ],
    value: ({unitId, tenantId}: {unitId: string; tenantId: string}) => ({
      location: ref(unitId),
      tenant: ref(tenantId),
    }),
  },

  // ── Parking: Facility -> Spot ──────────────────────────

  {
    id: 'spot-by-facility',
    title: 'Parkplatz in Anlage',
    schemaType: 'parkingSpot',
    parameters: [{name: 'facilityId', type: 'string'}],
    value: ({facilityId}: {facilityId: string}) => ({
      facility: ref(facilityId),
    }),
  },

  // ── Outdoor -> Asset ───────────────────────────────────

  {
    id: 'asset-by-outdoor',
    title: 'Asset in Aussenanlage',
    schemaType: 'asset',
    parameters: [
      {name: 'outdoorId', type: 'string'},
      {name: 'tenantId', type: 'string'},
    ],
    value: ({outdoorId, tenantId}: {outdoorId: string; tenantId: string}) => ({
      location: ref(outdoorId),
      tenant: ref(tenantId),
    }),
  },
]
