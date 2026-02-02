import type {
  DefaultDocumentNodeResolver,
  StructureResolver,
} from 'sanity/structure'

import { QRGenerator } from './components/QRGenerator'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items(S.documentTypeListItems())

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
