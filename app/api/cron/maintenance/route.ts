import {NextResponse} from 'next/server'
import {createClient} from 'next-sanity'

// ── Config ───────────────────────────────────────────────
const CRON_SECRET = process.env.CRON_SECRET

// Lazy-init write client (serverless-safe)
let _client: ReturnType<typeof createClient> | null = null
function getClient() {
  if (!_client) {
    _client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2024-01-01',
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
    })
  }
  return _client
}

// ── Types ────────────────────────────────────────────────
interface DuePlan {
  _id: string
  title: string
  description?: string
  frequency: string
  nextDueDate: string
  scope?: {_ref: string; _type: string}
  tenant?: {_ref: string; _type: string}
  assignedProvider?: {_ref: string; _type: string}
}

// ── Date Calculation ─────────────────────────────────────
// Advances a date by the given frequency to maintain cadence.
// Uses the PREVIOUS nextDueDate as base (not "today") so
// schedules don't drift when the cron runs a day late.
function advanceDate(dateStr: string, frequency: string): string {
  const d = new Date(dateStr)

  switch (frequency) {
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3)
      break
    case 'biannual':
      d.setMonth(d.getMonth() + 6)
      break
    case 'annual':
      d.setFullYear(d.getFullYear() + 1)
      break
    case 'biennial':
      d.setFullYear(d.getFullYear() + 2)
      break
    default:
      // Unknown frequency: push 1 month as fallback
      d.setMonth(d.getMonth() + 1)
  }

  return d.toISOString().split('T')[0] // YYYY-MM-DD
}

// ── GROQ: Fetch all due plans ────────────────────────────
const DUE_PLANS_QUERY = `*[
  _type == "maintenancePlan"
  && isActive == true
  && nextDueDate <= now()
  && !(_id in path("drafts.**"))
]{
  _id,
  title,
  description,
  frequency,
  nextDueDate,
  scope,
  tenant,
  assignedProvider
}`

// ── Auth Check ───────────────────────────────────────────
function isAuthorized(req: Request): boolean {
  // 1. Check query param ?key=SECRET
  const url = new URL(req.url)
  const keyParam = url.searchParams.get('key')
  if (CRON_SECRET && keyParam === CRON_SECRET) return true

  // 2. Check Authorization: Bearer SECRET
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true

  // 3. If no CRON_SECRET is configured, block entirely
  if (!CRON_SECRET) return false

  return false
}

// ── GET Handler ──────────────────────────────────────────
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  // ── Auth ──────────────────────────────────────────────
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {error: 'Unauthorized. Provide ?key=CRON_SECRET or Authorization: Bearer CRON_SECRET'},
      {status: 401}
    )
  }

  // ── Preflight checks ─────────────────────────────────
  if (!process.env.SANITY_API_TOKEN) {
    return NextResponse.json(
      {error: 'Server misconfiguration: SANITY_API_TOKEN is not set.'},
      {status: 500}
    )
  }

  const client = getClient()
  const today = new Date().toISOString().split('T')[0]

  const result = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    details: [] as string[],
  }

  try {
    // ── Step 1: Fetch due plans ─────────────────────────
    const duePlans: DuePlan[] = await client.fetch(DUE_PLANS_QUERY)

    if (duePlans.length === 0) {
      return NextResponse.json({
        ...result,
        message: 'No maintenance plans are due. Nothing to do.',
      })
    }

    // ── Step 2: Process each plan in a transaction ──────
    for (const plan of duePlans) {
      try {
        // Validate: scope is required for ticket creation
        if (!plan.scope?._ref) {
          result.skipped++
          result.errors.push(
            `Plan "${plan.title}" (${plan._id}): Skipped — no scope reference.`
          )
          continue
        }

        // Build the ticket document
        const ticketDoc: Record<string, unknown> = {
          _type: 'ticket',
          title: `Wartung: ${plan.title}`,
          description: plan.description || `Automatisch erstellt aus Wartungsplan: ${plan.title}`,
          status: 'open',
          priority: 'medium',
          scope: {
            _type: 'reference',
            _ref: plan.scope._ref,
          },
          reportedByName: 'System (Wartungsplan)',
        }

        // Link tenant if present
        if (plan.tenant?._ref) {
          ticketDoc.tenant = {
            _type: 'reference',
            _ref: plan.tenant._ref,
          }
        }

        // Link assigned provider if present
        if (plan.assignedProvider?._ref) {
          ticketDoc.assignedProvider = {
            _type: 'reference',
            _ref: plan.assignedProvider._ref,
          }
        }

        // Calculate next due date based on frequency
        const newNextDueDate = advanceDate(plan.nextDueDate, plan.frequency)

        // Execute as a transaction: create ticket + patch plan
        const tx = client.transaction()

        // Op A: Create ticket
        tx.create(ticketDoc)

        // Op B: Update the maintenance plan
        tx.patch(plan._id, (p) =>
          p.set({
            lastExecutionDate: today,
            nextDueDate: newNextDueDate,
          })
        )

        await tx.commit()

        result.created++
        result.updated++
        result.details.push(
          `"${plan.title}" -> Ticket created, next due: ${newNextDueDate}`
        )
      } catch (planError: unknown) {
        const msg =
          planError instanceof Error ? planError.message : String(planError)
        result.errors.push(`Plan "${plan.title}" (${plan._id}): ${msg}`)
      }
    }

    return NextResponse.json({
      ...result,
      message: `Processed ${duePlans.length} due plan(s).`,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {error: `Cron job failed: ${msg}`},
      {status: 500}
    )
  }
}
