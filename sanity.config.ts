'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `/app/studio/[[...tool]]` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {dashboardTool} from '@sanity/dashboard'
import {documentListWidget} from 'sanity-plugin-dashboard-widget-document-list'
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure, defaultDocumentNode} from './sanity/deskStructure'
import {contextTemplates} from './sanity/templates'
import {ResolveTicketAction} from './sanity/actions/ResolveTicketAction'
import {ApproveTicketAction} from './sanity/actions/ApproveTicketAction'
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
    templates: (prev) => {
      // Remove duplicate default 'tenant' template
      const filtered = prev.filter((t) => t.id !== 'tenant')

      return [
        ...filtered,
        // Tenant template for intent URL resolution
        {
          id: 'tenant',
          title: 'Neuer Mandant',
          schemaType: 'tenant',
          value: () => ({}),
        },
        // All context-injection templates (from sanity/templates.ts)
        ...contextTemplates,
      ]
    },
  },

  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'ticket') {
        return [ApproveTicketAction, ResolveTicketAction, ...prev]
      }
      return prev
    },
  },

  plugins: [
    dashboardTool({
      widgets: [
        documentListWidget({
          title: 'PILNE INTERWENCJE',
          query: `*[_type == "ticket" && priority in ["emergency", "high"] && status in ["open", "in_progress", "pending_approval"]] | order(_createdAt desc)`,
          limit: 10,
          layout: {width: 'full'},
        }),
        documentListWidget({
          title: 'WYMIANA SPRZETU (CAPEX)',
          query: `*[_type == "asset" && condition in ["poor", "defect", "critical"]] | order(_createdAt desc)`,
          limit: 10,
          layout: {width: 'medium'},
        }),
        documentListWidget({
          title: 'OSTATNIE ZGLOSZENIA',
          query: `*[_type == "ticket"] | order(_createdAt desc)`,
          limit: 5,
          layout: {width: 'medium'},
        }),
      ],
    }),
    structureTool({ structure, defaultDocumentNode }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],

  studio: {
    components: {
      logo: RutaLogo
    }
  }
})
