import type {
  DefaultDocumentNodeResolver,
  StructureResolver,
} from 'sanity/structure'

import { QRGenerator } from './components/QRGenerator'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
type StructureBuilder = Parameters<StructureResolver>[0]

const buildingView = (S: StructureBuilder, buildingId: string) =>
  S.list()
    .title('Gebäude')
    .items([
      S.listItem()
        .title('Gebäude bearbeiten')
        .child(
          S.document().schemaType('building').documentId(buildingId)
        ),
      S.listItem()
        .title('Ebenen & Bereiche')
        .child(
          S.documentTypeList('floor')
            .title('Ebenen & Bereiche')
            .filter('_type == "floor" && building._ref == $buildingId')
            .params({ buildingId })
            .initialValueTemplates([
              S.initialValueTemplateItem('floor-by-building', { buildingId }),
            ])
            .child((floorId) => floorView(S, buildingId, floorId))
        ),
      S.listItem()
        .title('Direkte Assets (z.B. Lift)')
        .child(
          S.documentTypeList('asset')
            .title('Direkte Assets (z.B. Lift)')
            .filter(
              '_type == "asset" && building._ref == $buildingId && !defined(parentFloor)'
            )
            .params({ buildingId })
            .initialValueTemplates([
              S.initialValueTemplateItem('asset-by-building', { buildingId }),
            ])
        ),
    ])

const floorView = (
  S: StructureBuilder,
  buildingId: string,
  floorId: string
) =>
  S.list()
    .title('Ebene')
    .items([
      S.listItem()
        .title('Ebene bearbeiten')
        .child(S.document().schemaType('floor').documentId(floorId)),
      S.listItem()
        .title('Räume & Einheiten')
        .child(
          S.documentTypeList('unit')
            .title('Räume & Einheiten')
            .filter('_type == "unit" && floor._ref == $floorId')
            .params({ floorId })
            .initialValueTemplates([
              S.initialValueTemplateItem('unit-by-floor', { buildingId, floorId }),
            ])
            .child((unitId) => unitView(S, buildingId, floorId, unitId))
        ),
      S.listItem()
        .title('Assets auf Ebene')
        .child(
          S.documentTypeList('asset')
            .title('Assets auf Ebene')
            .filter(
              '_type == "asset" && parentFloor._ref == $floorId && !defined(parentUnit)'
            )
            .params({ floorId })
            .initialValueTemplates([
              S.initialValueTemplateItem('asset-by-floor', { buildingId, floorId }),
            ])
        ),
    ])

const unitView = (
  S: StructureBuilder,
  buildingId: string,
  floorId: string,
  unitId: string
) =>
  S.list()
    .title('Einheit')
    .items([
      S.listItem()
        .title('Einheit bearbeiten')
        .child(S.document().schemaType('unit').documentId(unitId)),
      S.listItem()
        .title('Assets im Raum')
        .child(
          S.documentTypeList('asset')
            .title('Assets im Raum')
            .filter('_type == "asset" && parentUnit._ref == $unitId')
            .params({ unitId })
            .initialValueTemplates([
              S.initialValueTemplateItem('asset-by-unit', {
                buildingId,
                floorId,
                unitId,
              }),
            ])
        ),
    ])

export const structure: StructureResolver = (S) =>
  S.documentTypeList('client')
    .title('Kunden')
    .child((clientId) =>
      S.documentTypeList('building')
        .title('Gebäude')
        .filter('_type == "building" && client._ref == $clientId')
        .params({ clientId })
        .child((buildingId) => buildingView(S, buildingId))
    )

export const defaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  { schemaType }
) => {
  if (schemaType === 'asset') {
    return S.document().views([
      S.view.form(),
      S.view.component(QRGenerator).title('QR Code'),
    ])
  }
  if (schemaType === 'building') {
    return S.document().views([
      S.view.form(),
      S.view.component(QRGenerator).title('QR Codes List'),
    ])
  }
  return S.document()
}
