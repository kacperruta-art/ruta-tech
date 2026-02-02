import { type SchemaTypeDefinition } from 'sanity'

import { asset } from './asset'
import { assetType } from './assetType'
import {
  building,
  buildingCertificate,
  usageUnit,
  commonArea,
  zoneItem,
  zone,
} from './building'
import { client } from './client'
import { floor } from './floor'
import { unit } from './unit'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    client,
    building,
    usageUnit,
    commonArea,
    buildingCertificate,
    floor,
    unit,
    zoneItem,
    zone,
    assetType,
    asset,
  ],
}
