import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'

import { schema } from '@/sanity/schemaTypes'
import { structure, defaultDocumentNode } from '@/sanity/structure'
import { projectId, dataset } from '@/sanity/env'

export default defineConfig({
  basePath: '/studio',
  title: 'Ruta Tech Admin',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    visionTool(),
  ],
  schema,
})
