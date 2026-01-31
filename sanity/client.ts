/**
 * Sanity client re-export for API and server-side usage.
 * Use this client when fresh data is required (e.g. PIN verification).
 */
import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})
