import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
// visionTool removed for a clean interface for end users

import { schema } from '@/sanity/schemaTypes'
import { structure, defaultDocumentNode } from '@/sanity/structure'
import { projectId, dataset } from '@/sanity/env'
import { Logo } from '@/sanity/components/Logo'

export default defineConfig({
  basePath: '/studio',
  title: 'Ruta Control Panel',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    // visionTool(),
  ],
  schema,
  studio: {
    components: {
      logo: Logo,
    },
  },
})
