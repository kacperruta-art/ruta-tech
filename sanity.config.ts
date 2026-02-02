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
  // Change title to verify deployment worked
  title: 'Ruta Tech Admin',

  schema: {
    ...schema,
    templates: (prev) => [
      ...prev,
      // 1. Create Floor inside Building
      {
        id: 'floor-by-building',
        title: 'Neue Ebene in Gebäude',
        schemaType: 'floor',
        parameters: [{ name: 'buildingId', type: 'string' }],
        value: ({ buildingId }: { buildingId: string }) => ({
          building: { _type: 'reference', _ref: buildingId },
        }),
      },
      // 2. Create Unit inside Floor (needs Building ID too for query efficiency)
      {
        id: 'unit-by-floor',
        title: 'Neuer Raum auf Ebene',
        schemaType: 'unit',
        parameters: [
          { name: 'buildingId', type: 'string' },
          { name: 'floorId', type: 'string' },
        ],
        value: ({
          buildingId,
          floorId,
        }: {
          buildingId: string
          floorId: string
        }) => ({
          building: { _type: 'reference', _ref: buildingId },
          floor: { _type: 'reference', _ref: floorId },
        }),
      },
      // 3. Asset directly on Building (e.g., Lift)
      {
        id: 'asset-by-building',
        title: 'Neues Asset (Gebäude-Ebene)',
        schemaType: 'asset',
        parameters: [{ name: 'buildingId', type: 'string' }],
        value: ({ buildingId }: { buildingId: string }) => ({
          building: { _type: 'reference', _ref: buildingId },
        }),
      },
      // 4. Asset on Floor (e.g., Corridor Light)
      {
        id: 'asset-by-floor',
        title: 'Neues Asset (Ebene)',
        schemaType: 'asset',
        parameters: [
          { name: 'buildingId', type: 'string' },
          { name: 'floorId', type: 'string' },
        ],
        value: ({
          buildingId,
          floorId,
        }: {
          buildingId: string
          floorId: string
        }) => ({
          building: { _type: 'reference', _ref: buildingId },
          parentFloor: { _type: 'reference', _ref: floorId },
        }),
      },
      // 5. Asset in Unit (e.g., Washing Machine)
      {
        id: 'asset-by-unit',
        title: 'Neues Asset (Raum)',
        schemaType: 'asset',
        parameters: [
          { name: 'buildingId', type: 'string' },
          { name: 'floorId', type: 'string' },
          { name: 'unitId', type: 'string' },
        ],
        value: ({
          buildingId,
          floorId,
          unitId,
        }: {
          buildingId: string
          floorId: string
          unitId: string
        }) => ({
          building: { _type: 'reference', _ref: buildingId },
          parentFloor: { _type: 'reference', _ref: floorId },
          parentUnit: { _type: 'reference', _ref: unitId },
        }),
      },
    ],
  },

  plugins: [
    structureTool({structure, defaultDocumentNode}),
    visionTool({defaultApiVersion: apiVersion}),
  ],

  studio: {
    components: {
      logo: RutaLogo
    }
  }
})
