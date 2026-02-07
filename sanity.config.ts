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
      // Filter out any broken/duplicate default 'tenant' template
      const filtered = prev.filter((t) => t.id !== 'tenant')

      return [
        ...filtered,

        // ── FORCE: Tenant template for intent URL resolution ──
        {
          id: 'tenant',
          title: 'Neuer Mandant',
          schemaType: 'tenant',
          value: () => ({}),
        },

        // Existing tenant-scoped templates
        {
          id: 'provider-by-tenant',
        title: 'Dienstleister (Mandant)',
        schemaType: 'provider',
        parameters: [{name: 'tenantId', type: 'string'}],
        value: ({tenantId}: {tenantId: string}) => ({
          tenant: {_type: 'reference', _ref: tenantId},
        }),
      },
      {
        id: 'user-by-tenant',
        title: 'Benutzer (Mandant)',
        schemaType: 'user',
        parameters: [{name: 'tenantId', type: 'string'}],
        value: ({tenantId}: {tenantId: string}) => ({
          tenant: {_type: 'reference', _ref: tenantId},
        }),
      },

      // ── Context Injection Templates ────────────────────────

      // 1. Property -> Building
      {
        id: 'building-by-property',
        title: 'Gebaeude in Liegenschaft',
        schemaType: 'building',
        parameters: [
          {name: 'propertyId', type: 'string'},
          {name: 'tenantId', type: 'string'},
        ],
        value: ({propertyId, tenantId}: {propertyId: string; tenantId: string}) => ({
          property: {_type: 'reference', _ref: propertyId},
          tenant: {_type: 'reference', _ref: tenantId},
        }),
      },
      // 2. Building -> Floor
      {
        id: 'floor-by-building',
        title: 'Stockwerk in Gebaeude',
        schemaType: 'floor',
        parameters: [
          {name: 'buildingId', type: 'string'},
          {name: 'tenantId', type: 'string'},
        ],
        value: ({buildingId, tenantId}: {buildingId: string; tenantId: string}) => ({
          building: {_type: 'reference', _ref: buildingId},
          tenant: {_type: 'reference', _ref: tenantId},
        }),
      },
      // 3. Floor -> Unit (auto-fills Building too)
      {
        id: 'unit-by-floor',
        title: 'Einheit auf Stockwerk',
        schemaType: 'unit',
        parameters: [
          {name: 'floorId', type: 'string'},
          {name: 'buildingId', type: 'string'},
          {name: 'tenantId', type: 'string'},
        ],
        value: ({floorId, buildingId, tenantId}: {floorId: string; buildingId: string; tenantId: string}) => ({
          floor: {_type: 'reference', _ref: floorId},
          building: {_type: 'reference', _ref: buildingId},
          tenant: {_type: 'reference', _ref: tenantId},
        }),
      },
      // 4. Unit -> Asset (location: Unit)
      {
        id: 'asset-by-unit',
        title: 'Asset in Einheit',
        schemaType: 'asset',
        parameters: [
          {name: 'unitId', type: 'string'},
          {name: 'tenantId', type: 'string'},
        ],
        value: ({unitId, tenantId}: {unitId: string; tenantId: string}) => ({
          location: {_type: 'reference', _ref: unitId},
          tenant: {_type: 'reference', _ref: tenantId},
        }),
      },
      // 5. Parking Facility -> Spot
      {
        id: 'spot-by-facility',
        title: 'Parkplatz in Anlage',
        schemaType: 'parkingSpot',
        parameters: [{name: 'facilityId', type: 'string'}],
        value: ({facilityId}: {facilityId: string}) => ({
          facility: {_type: 'reference', _ref: facilityId},
        }),
      },
      // 6. Outdoor -> Asset
      {
        id: 'asset-by-outdoor',
        title: 'Asset in Aussenanlage',
        schemaType: 'asset',
        parameters: [
          {name: 'outdoorId', type: 'string'},
          {name: 'tenantId', type: 'string'},
        ],
        value: ({outdoorId, tenantId}: {outdoorId: string; tenantId: string}) => ({
          location: {_type: 'reference', _ref: outdoorId},
          tenant: {_type: 'reference', _ref: tenantId},
        }),
      },
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
    structureTool({ structure, defaultDocumentNode }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],

  studio: {
    components: {
      logo: RutaLogo
    }
  }
})
