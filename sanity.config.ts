import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { schema } from '@/sanity/schemaTypes'
import { structure, defaultDocumentNode } from '@/sanity/structure'
import { projectId, dataset } from '@/sanity/env'

// Import the custom logo component
import { RutaLogo } from '@/sanity/components/RutaLogo'

export default defineConfig({
  basePath: '/studio',
  title: 'Ruta Control Panel',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure, defaultDocumentNode }),
  ],
  schema,
  studio: {
    components: {
      logo: RutaLogo,
    },
  },
})