import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '@/sanity/env'

// ── Read Client (CDN, no token) ──────────────────────────
// Use for all read operations - fast, cached
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

// ── Write Client (No CDN, with token) ────────────────────
// Use for mutations (create, update, delete)
// Token is loaded from SANITY_API_TOKEN environment variable
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})
