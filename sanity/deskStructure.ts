import type {
  DefaultDocumentNodeResolver,
  StructureResolver,
} from 'sanity/structure'
import { EditIcon } from '@sanity/icons'

import { QRGenerator } from './components/QRGenerator'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
type StructureBuilder = Parameters<StructureResolver>[0]

const buildingChildrenView = (S: StructureBuilder, buildingId: string) =>
  S.list()
    .title('Gebäude Inhalt')
    .items([
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

const buildingView = (S: StructureBuilder, buildingId: string) =>
  S.list()
    .title('Gebäude')
    .items([
      S.listItem()
        .title('Gebäude bearbeiten')
        .icon(EditIcon)
        .child(S.document().schemaType('building').documentId(buildingId)),
      S.listItem()
        .title('Gebäude Inhalt')
        .child(buildingChildrenView(S, buildingId)),
    ])

const floorChildrenView = (
  S: StructureBuilder,
  buildingId: string,
  floorId: string
) =>
  S.list()
    .title('Ebene Inhalt')
    .items([
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
        .icon(EditIcon)
        .child(S.document().schemaType('floor').documentId(floorId)),
      S.listItem()
        .title('Ebene Inhalt')
        .child(floorChildrenView(S, buildingId, floorId)),
    ])

const unitChildrenView = (
  S: StructureBuilder,
  buildingId: string,
  floorId: string,
  unitId: string
) =>
  S.list()
    .title('Einheit Inhalt')
    .items([
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
        .icon(EditIcon)
        .child(S.document().schemaType('unit').documentId(unitId)),
      S.listItem()
        .title('Einheit Inhalt')
        .child(unitChildrenView(S, buildingId, floorId, unitId)),
    ])

const clientView = (S: StructureBuilder, clientId: string) =>
  S.list()
    .title('Kunde')
    .items([
      S.listItem()
        .title('Kunde bearbeiten')
        .icon(EditIcon)
        .child(S.document().schemaType('client').documentId(clientId)),
      S.listItem()
        .title('Gebäude')
        .child(
          S.documentTypeList('building')
            .title('Gebäude')
            .filter('_type == "building" && client._ref == $clientId')
            .params({ clientId })
            .child((buildingId) => buildingView(S, buildingId))
        ),
    ])

export const structure: StructureResolver = (S) =>
  S.documentTypeList('client')
    .title('Kunden')
    .child((clientId) =>
      clientView(S, clientId)
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
