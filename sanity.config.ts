'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `/app/studio/[[...tool]]` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure, defaultDocumentNode} from './sanity/deskStructure'
import React from 'react'

// Define Logo INLINE - No external files, no JSX compilation issues
const RutaLogo = () => {
  return React.createElement(
    'div',
    {
      style: {
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        color: 'inherit'
      }
    },
    [
      React.createElement('span', { key: 'r' }, 'RUTA'),
      React.createElement('span', { key: 's', style: { color: '#0066aa', margin: '0 4px' } }, '//'),
      React.createElement('span', { key: 't' }, 'TECH')
    ]
  )
}

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'RUTA // TECH V2',

  schema: {
    ...schema,
    templates: (prev) => [
      ...prev,
      {
        id: 'provider-by-tenant',
        title: 'Dienstleister (Mandant)',
        schemaType: 'provider',
        parameters: [{ name: 'tenantId', type: 'string' }],
        value: ({ tenantId }: { tenantId: string }) => ({
          tenant: { _type: 'reference', _ref: tenantId },
        }),
      },
      {
        id: 'user-by-tenant',
        title: 'Benutzer (Mandant)',
        schemaType: 'user',
        parameters: [{ name: 'tenantId', type: 'string' }],
        value: ({ tenantId }: { tenantId: string }) => ({
          tenant: { _type: 'reference', _ref: tenantId },
        }),
      },
    ],
  },

  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],

  studio: {
    components: {
      logo: RutaLogo
    }
  }
})
