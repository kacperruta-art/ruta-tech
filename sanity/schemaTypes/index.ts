import { type SchemaTypeDefinition } from 'sanity'

import { asset } from './asset'
import { assetType } from './assetType'
import {
  building,
  buildingCertificate,
  usageUnit,
  commonArea,
  floor,
  zoneItem,
  zone,
} from './building'
import { client } from './client'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    client,
    building,
    usageUnit,
    commonArea,
    buildingCertificate,
    floor,
    zoneItem,
    zone,
    assetType,
    asset,
  ],
}
