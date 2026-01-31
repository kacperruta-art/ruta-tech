import { type SchemaTypeDefinition } from 'sanity'

import { asset } from './asset'
import { assetType } from './assetType'
import { building } from './building'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [asset, assetType, building],
}
