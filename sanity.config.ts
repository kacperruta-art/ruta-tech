import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schema } from '@/sanity/schemaTypes'
import { structure, defaultDocumentNode } from '@/sanity/structure'
import { projectId, dataset } from '@/sanity/env'
import React from 'react'

// 1. Define Logo INLINE using pure React (safe for .ts files)
const RutaLogo = () => {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        fontFamily: "'JetBrains Mono', monospace, sans-serif",
        fontWeight: 700,
        fontSize: '1.2rem',
        lineHeight: 1.2,
        color: 'inherit',
      },
    },
    [
      React.createElement('span', { key: 'text1' }, 'RUTA'),
      React.createElement(
        'span',
        {
          key: 'sep',
          style: { color: '#0066aa', margin: '0 4px' },
        },
        '//'
      ),
      React.createElement('span', { key: 'text2' }, 'TECH'),
    ]
  )
}

export default defineConfig({
  basePath: '/studio',
  name: 'Ruta_Technologies',
  title: 'Ruta Technologies',
  projectId,
  dataset,
  plugins: [structureTool({ structure, defaultDocumentNode })],
  schema,
  studio: {
    components: {
      logo: RutaLogo, // Updated inline component
    },
  },
})
