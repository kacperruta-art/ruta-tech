import { asset } from './asset'
import { assetType } from './assetType'
import { client } from './client'
import { building } from './building'
import { floor } from './floor'
import { unit } from './unit'

export const schema = {
  types: [
    client,
    building,
    floor,
    unit,
    asset,
    assetType,
  ],
}
