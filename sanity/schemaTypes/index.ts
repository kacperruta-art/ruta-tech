import { asset } from './asset'
import { assetType } from './assetType'
import { client } from './client'
import {
  building,
  buildingCertificate,
  usageUnit,
  commonArea,
  zoneItem,
  zone,
} from './building'
import { floor } from './floor'
import { unit } from './unit'

export const schema = {
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
    asset,
    assetType,
  ],
}
