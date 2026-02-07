// RUTA-TECH V2.0 — Schema Registry
// All document and object types for the Sanity Studio.

import { tenant } from './tenant'
import { provider } from './provider'
import { property } from './property'
import { building } from './building'
import { floor } from './floor'
import { unit } from './unit'
import { parkingFacility, parkingSpot } from './parkingFacility'
import { asset } from './asset'
import { ticket } from './ticket'
import { logbookEntry } from './logbookEntry'
import { user } from './user'
import { outdoorArea } from './outdoorArea'
import { maintenancePlan } from './maintenancePlan'
import { meterReading } from './meterReading'

export const schemaTypes = [
  // Core config
  tenant,
  user,

  // Hierarchy
  property,
  building,
  floor,
  unit,

  // Parking & Outdoor
  parkingFacility,
  parkingSpot,
  outdoorArea,

  // Assets & Operations
  asset,
  ticket,
  logbookEntry,
  maintenancePlan,
  meterReading,

  // Service partners
  provider,
]

// Backward-compatible export consumed by sanity.config.ts
export const schema = {
  types: schemaTypes,
}
