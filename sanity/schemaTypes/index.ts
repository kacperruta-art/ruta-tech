import { type SchemaTypeDefinition } from 'sanity'

import { asset } from './asset'
import { assetType } from './assetType'
import { buildingSection } from './buildingSection'
import { client } from './client'
import { floor } from './floor'
import { property } from './property'
import { unit } from './unit'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    client,
    property,
    buildingSection,
    floor,
    unit,
    assetType,
    asset,
  ],
}
