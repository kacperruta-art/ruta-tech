import { groq } from 'next-sanity'
import { client } from './client'

// ── Shared projection fragments ──────────────────────────
// GROQ has no reusable fragments — we use JS template strings.

const TENANT_PROJECTION = `{
  _id,
  name,
  "slug": slug.current,
  brandPrimary,
  toneOfVoice,
  autoReply,
  defaultLocale,
  escalationKeywords
}`

const PROPERTY_PROJECTION = `{
  _id,
  name,
  "slug": slug.current
}`

const PROVIDER_PROJECTION = `{
  role,
  priority,
  customNote,
  "providerName": provider->companyName,
  "dispatchEmail": provider->dispatchEmail,
  "emergencyPhone": provider->emergencyPhone,
  "trade": provider->primaryTrade
}`

// Full building projection including tenant + property parents
const BUILDING_FULL_PROJECTION = `{
  _id,
  name,
  "pin": chatAccessPin,
  "address": address{ street, zip, city, canton },
  "tenantSlug": tenant->slug.current,
  "tenant": tenant->${TENANT_PROJECTION},
  "property": property->${PROPERTY_PROJECTION}
}`

// ── 1. DEEP CONTEXT QUERY (Primary Chat Query) ──────────
//
// Universal matcher: resolves ANY document type by _id, qrCodeId, or slug.
// Then climbs the full hierarchy:
//   unit → floor → building → property → tenant
//   floor → building → property → tenant
//   building → property → tenant
//   parkingFacility → property → tenant (+ connectedBuildings[0])
//   property → tenant
//   asset → location → (one of the above)

export const deepContextQuery = groq`
  *[
    _type in ["asset", "building", "floor", "unit", "parkingFacility", "property"]
    && (_id == $slug || qrCodeId.current == $slug || slug.current == $slug)
  ][0] {
    _id,
    _type,
    name,
    "qrCodeId": qrCodeId.current,
    status,
    manufacturer,
    model,
    serialNumber,
    installDate,
    warrantyEnd,

    // ══════════════════════════════════════════════════
    // ── Deep Location Context ────────────────────────
    // ══════════════════════════════════════════════════
    "context": select(

      // ── Direct type matches (scanned QR points to a non-asset) ──

      _type == "unit" => {
        "title": name,
        "subtitle": coalesce(floor->title, "Ebene " + string(floor->levelNumber))
                    + ", " + building->name,
        "type": "unit",
        "unitId": _id,
        "floorId": floor->_id,
        "buildingId": building->_id,
        "propertyId": building->property->_id
      },

      _type == "floor" => {
        "title": coalesce(title, "Ebene " + string(levelNumber)),
        "subtitle": building->name,
        "type": "floor",
        "unitId": null,
        "floorId": _id,
        "buildingId": building->_id,
        "propertyId": building->property->_id
      },

      _type == "building" => {
        "title": name,
        "subtitle": coalesce(address.street + ", " + address.city, ""),
        "type": "building",
        "unitId": null,
        "floorId": null,
        "buildingId": _id,
        "propertyId": property->_id
      },

      _type == "parkingFacility" => {
        "title": name,
        "subtitle": coalesce(property->name, ""),
        "type": "parking",
        "unitId": null,
        "floorId": null,
        "buildingId": connectedBuildings[0]->_id,
        "propertyId": property->_id
      },

      _type == "property" => {
        "title": name,
        "subtitle": "",
        "type": "property",
        "unitId": null,
        "floorId": null,
        "buildingId": null,
        "propertyId": _id
      },

      // ── Asset: resolve via polymorphic location ref ──

      _type == "asset" => select(
        location->_type == "unit" => {
          "title": location->name,
          "subtitle": coalesce(location->floor->title, "Ebene " + string(location->floor->levelNumber))
                      + ", " + location->building->name,
          "type": "unit",
          "unitId": location->_id,
          "floorId": location->floor->_id,
          "buildingId": location->building->_id,
          "propertyId": location->building->property->_id
        },
        location->_type == "floor" => {
          "title": coalesce(location->title, "Ebene " + string(location->levelNumber)),
          "subtitle": location->building->name,
          "type": "floor",
          "unitId": null,
          "floorId": location->_id,
          "buildingId": location->building->_id,
          "propertyId": location->building->property->_id
        },
        location->_type == "building" => {
          "title": location->name,
          "subtitle": coalesce(location->address.street + ", " + location->address.city, ""),
          "type": "building",
          "unitId": null,
          "floorId": null,
          "buildingId": location->_id,
          "propertyId": location->property->_id
        },
        location->_type == "parkingFacility" => {
          "title": location->name,
          "subtitle": coalesce(location->property->name, ""),
          "type": "parking",
          "unitId": null,
          "floorId": null,
          "buildingId": location->connectedBuildings[0]->_id,
          "propertyId": location->property->_id
        },
        location->_type == "property" => {
          "title": location->name,
          "subtitle": "",
          "type": "property",
          "unitId": null,
          "floorId": null,
          "buildingId": null,
          "propertyId": location->_id
        },
        // No location set
        {
          "title": name,
          "subtitle": "Kein Standort zugewiesen",
          "type": "unknown",
          "unitId": null,
          "floorId": null,
          "buildingId": null,
          "propertyId": null
        }
      ),

      // ── Global fallback ──
      {
        "title": name,
        "subtitle": "",
        "type": "unknown",
        "unitId": null,
        "floorId": null,
        "buildingId": null,
        "propertyId": null
      }
    ),

    // ══════════════════════════════════════════════════
    // ── Building Auth + Tenant + Property (Full Hierarchy) ──
    // ══════════════════════════════════════════════════
    "building": select(

      // Direct type matches
      _type == "unit"
        => building->${BUILDING_FULL_PROJECTION},
      _type == "floor"
        => building->${BUILDING_FULL_PROJECTION},
      _type == "building"
        => {
          _id,
          name,
          "pin": chatAccessPin,
          "address": address{ street, zip, city, canton },
          "tenantSlug": tenant->slug.current,
          "tenant": tenant->${TENANT_PROJECTION},
          "property": property->${PROPERTY_PROJECTION}
        },
      _type == "parkingFacility"
        => connectedBuildings[0]->${BUILDING_FULL_PROJECTION},
      _type == "property"
        => {
          _id,
          name,
          "pin": null,
          "address": null,
          "tenantSlug": tenant->slug.current,
          "tenant": tenant->${TENANT_PROJECTION},
          "property": { _id, name, "slug": slug.current }
        },

      // Asset: polymorphic location climb
      _type == "asset" => select(
        location->_type == "unit"
          => location->building->${BUILDING_FULL_PROJECTION},
        location->_type == "floor"
          => location->building->${BUILDING_FULL_PROJECTION},
        location->_type == "building"
          => location->${BUILDING_FULL_PROJECTION},
        location->_type == "parkingFacility"
          => location->connectedBuildings[0]->${BUILDING_FULL_PROJECTION},
        location->_type == "property"
          => {
            "_id": location->_id,
            "name": location->name,
            "pin": null,
            "address": null,
            "tenantSlug": location->tenant->slug.current,
            "tenant": location->tenant->${TENANT_PROJECTION},
            "property": { "_id": location->_id, "name": location->name, "slug": location->slug.current }
          },
        null
      ),

      null
    ),

    // ══════════════════════════════════════════════════
    // ── Service Matrix (from Building, fallback-ready) ──
    // ══════════════════════════════════════════════════
    "serviceMatrix": select(

      // Direct type matches
      _type == "unit"
        => building->serviceProviders[]${PROVIDER_PROJECTION},
      _type == "floor"
        => building->serviceProviders[]${PROVIDER_PROJECTION},
      _type == "building"
        => serviceProviders[]${PROVIDER_PROJECTION},
      _type == "parkingFacility"
        => connectedBuildings[0]->serviceProviders[]${PROVIDER_PROJECTION},

      // Asset: polymorphic location climb
      _type == "asset" => select(
        location->_type == "unit"
          => location->building->serviceProviders[]${PROVIDER_PROJECTION},
        location->_type == "floor"
          => location->building->serviceProviders[]${PROVIDER_PROJECTION},
        location->_type == "building"
          => location->serviceProviders[]${PROVIDER_PROJECTION},
        location->_type == "parkingFacility"
          => location->connectedBuildings[0]->serviceProviders[]${PROVIDER_PROJECTION},
        []
      ),

      []
    ),

    // ── Documents / Attachments ──────────────────────
    "documents": documents[]{ "url": asset->url, originalFilename }
  }
`

// Helper to fetch deep context
export async function getDeepContext(slug: string) {
  return await client.fetch(deepContextQuery, { slug })
}

// ── 2. ASSET PAGE QUERY (Lightweight validation for SSR) ─
// Used by the Next.js page component for quick validation.

export const assetPageQuery = groq`
  *[
    _type in ["asset", "building", "floor", "unit", "parkingFacility", "property"]
    && (_id == $slug || qrCodeId.current == $slug || slug.current == $slug)
  ][0] {
    _id,
    _type,
    name,
    "qrCodeId": qrCodeId.current,
    status,
    "image": image,

    // Minimal location label
    "locationLabel": select(
      _type == "unit"    => name + " · " + building->name,
      _type == "floor"   => coalesce(title, "Ebene " + string(levelNumber)) + " · " + building->name,
      _type == "building" => name,
      _type == "parkingFacility" => name,
      _type == "property" => name,
      _type == "asset" => select(
        location->_type == "unit"    => location->name + " · " + location->building->name,
        location->_type == "floor"   => coalesce(location->title, "Ebene " + string(location->levelNumber)) + " · " + location->building->name,
        location->_type == "building" => location->name,
        location->_type == "parkingFacility" => location->name,
        location->_type == "property" => location->name,
        "Kein Standort"
      ),
      "Kein Standort"
    ),

    // Auth essentials (with tenant inheritance)
    "building": select(
      _type == "unit"    => building->{ _id, name, "pin": chatAccessPin, "tenantSlug": tenant->slug.current },
      _type == "floor"   => building->{ _id, name, "pin": chatAccessPin, "tenantSlug": tenant->slug.current },
      _type == "building" => { _id, name, "pin": chatAccessPin, "tenantSlug": tenant->slug.current },
      _type == "parkingFacility" => connectedBuildings[0]->{ _id, name, "pin": chatAccessPin, "tenantSlug": tenant->slug.current },
      _type == "property" => { _id, name, "pin": null, "tenantSlug": tenant->slug.current },
      _type == "asset" => select(
        location->_type == "unit"    => location->building->{ _id, name, "pin": chatAccessPin, "tenantSlug": tenant->slug.current },
        location->_type == "floor"   => location->building->{ _id, name, "pin": chatAccessPin, "tenantSlug": tenant->slug.current },
        location->_type == "building" => location->{ _id, name, "pin": chatAccessPin, "tenantSlug": tenant->slug.current },
        location->_type == "parkingFacility" => location->connectedBuildings[0]->{ _id, name, "pin": chatAccessPin, "tenantSlug": tenant->slug.current },
        location->_type == "property" => { "_id": location->_id, "name": location->name, "pin": null, "tenantSlug": location->tenant->slug.current },
        null
      ),
      null
    )
  }
`

// Helper to fetch page data
export async function getAssetPageData(slug: string) {
  return await client.fetch(assetPageQuery, { slug })
}
