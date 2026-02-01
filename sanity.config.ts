import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schema } from '@/sanity/schemaTypes'
import { structure, defaultDocumentNode } from '@/sanity/structure'
import { projectId, dataset } from '@/sanity/env'

// Import the logo we just created
import { RutaLogo } from '@/sanity/components/RutaLogo'

export default defineConfig({
  basePath: '/studio',
  name: 'Ruta_Technologies',
  title: 'Ruta Technologies', // This text appears in browser tabs

  projectId,
  dataset,

  plugins: [
    structureTool({ structure, defaultDocumentNode }),
  ],

  schema,

  studio: {
    components: {
      logo: RutaLogo, // This replaces the text in Navbar AND Login Screen
    }
  }
})
