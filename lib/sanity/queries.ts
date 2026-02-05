import { groq } from 'next-sanity'

import { client } from './client'

// 1. ASSET CONTEXT QUERY (The "Mega-Prompt" Data)
// Fetches the asset, its location string, and the FULL building context flattened for AI.
export const assetContextQuery = groq`*[_type == "asset" && slug.current == $assetId][0]{
  _id,
  name,
  assetType,
  status,
  "serialNumber": serialNumber,
  "model": model,
  "installDate": installDate,
  
  // Location references + legacy fallback
  "location": {
    "floorName": parentFloor->name,
    "unitName": parentUnit->name,
    "legacyName": locationName
  },

  // Parent Building - The Source of Truth
  "building": building->{
    name,
    "pin": pin, // Critical for Auth
    "clientSlug": client->slug.current, // Critical for Multi-tenant check
    "address": { street, zip, city },
    
    "manager": manager[0], 
    
    // Tech DNA
    "tech": {
      heatingType,
      waterSupply,
      ventilationType,
      constructionYear
    },

    // The Tree Structure (For AI navigation)
    "structure": {
      "floors": locations[_type == "floor"]{
        name,
        "units": units[]{name, type},
        "commonAreas": commonAreas[]{name, type}
      },
      "zones": locations[_type == "zone"]{
        name,
        "items": items[]{name, type}
      },
      // Fallback for simple sections if used mixed
      "sections": locations[_type == "buildingSection"]{
        name,
        type
      }
    }
  },

  // Files
  "docs": documents[]{ "url": asset.url, originalFilename }
}`

// Helper to fetch data
export async function getAssetContext(assetId: string) {
  return await client.fetch(assetContextQuery, { assetId })
}

// 2. BASIC VALIDATION QUERY (For Page Load)
export const assetPageQuery = groq`*[_type == "asset" && slug.current == $assetId][0]{
  _id,
  name,
  "slug": slug.current,
  "type": assetType,
  "location": {
    "floorName": parentFloor->name,
    "unitName": parentUnit->name,
    "legacyName": locationName
  },
  "building": building->{
    name,
    "pin": pin,
    "clientSlug": client->slug.current
  },
  "mainImage": mainImage
}`

// 3. CHAT CONTEXT QUERY (V3 Deep Tree)
export const chatContextQuery = groq`
  *[_type in ["building", "floor", "unit", "asset"] && slug.current == $slug][0] {
    _id,
    _type,
    name,
    "slug": slug.current,
    
    // 1. RESOLVE PARENT BUILDING (Source of Truth for PIN & Settings)
    "building": select(
      _type == "building" => { _id, name, "pin": pin, "slug": slug.current },
      _type == "floor" => building->{ _id, name, "pin": pin, "slug": slug.current },
      _type == "unit" => building->{ _id, name, "pin": pin, "slug": slug.current },
      _type == "asset" => coalesce(
        parentUnit->building->{ _id, name, "pin": pin, "slug": slug.current },
        parentFloor->building->{ _id, name, "pin": pin, "slug": slug.current },
        parentBuilding->{ _id, name, "pin": pin, "slug": slug.current }
      )
    ),

    // 2. RESOLVE CONTEXT (Breadcrumbs for AI)
    "context": select(
      _type == "building" => "Building Entry",
      _type == "floor" => "Floor: " + name,
      _type == "unit" => "Room: " + name + " (Floor: " + coalesce(floor->name, "Unknown") + ")",
      _type == "asset" => "Asset: " + name
    )
  }
`;
