import { type SchemaTypeDefinition } from 'sanity'

import { asset } from './asset'
import { assetType } from './assetType'
import { building, buildingCertificate, buildingSection } from './building'
import { client } from './client'
import { floor } from './floor'
import { unit } from './unit'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    client,
    building,
    buildingSection,
    buildingCertificate,
    floor,
    unit,
    assetType,
    asset,
  ],
}
