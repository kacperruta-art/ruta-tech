import {useState, useEffect} from 'react'
import {useClient, useDocumentOperation} from 'sanity'
import {CheckCircle2} from 'lucide-react'

export function ResolveTicketAction(props: any) {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const client = useClient({apiVersion: '2024-01-01'})
  const [isPublishing, setIsPublishing] = useState(false)

  // Disable if already completed
  const isAlreadyDone =
    props.draft?.status === 'completed' ||
    props.published?.status === 'completed'

  useEffect(() => {
    if (isPublishing && !props.draft) {
      setIsPublishing(false)
    }
  }, [props.draft, isPublishing])

  if (props.type !== 'ticket') return null

  return {
    disabled: isPublishing || isAlreadyDone,
    label: isPublishing ? 'Wird verarbeitet...' : 'Abschliessen & Archivieren',
    icon: CheckCircle2,
    tone: 'positive' as const,

    onHandle: async () => {
      setIsPublishing(true)

      // 1. Get Ticket Data
      const ticketDoc = props.draft || props.published
      if (!ticketDoc) {
        setIsPublishing(false)
        return
      }

      // 2. Prepare Logbook Entry (Mapping Logic)
      const logbookEntry = {
        _type: 'logbookEntry',
        tenant: ticketDoc.tenant, // Keep same tenant
        target: ticketDoc.scope, // CRITICAL: Map Ticket Scope -> Logbook Target
        provider: ticketDoc.assignedProvider, // Keep same provider

        // Map Logic
        type: ticketDoc.priority === 'emergency' ? 'emergency' : 'repair',
        status: 'done',
        date: new Date().toISOString(),
        description: `Ticket-Abschluss: ${ticketDoc.title}\n\n${ticketDoc.description || ''}`,

        // Link back
        sourceTicket: {_type: 'reference', _ref: ticketDoc._id},

        // Copy Documents/Images
        documents: ticketDoc.images || [],
      }

      try {
        // Transaction: Create Logbook
        await client.create(logbookEntry)
        console.log('Logbook generated.')

        // 3. Close Ticket
        patch.execute([
          {set: {status: 'completed'}},
          {
            setIfMissing: {
              'resolutionData.completedAt': new Date().toISOString(),
            },
          },
        ])

        publish.execute()
        props.onComplete()
      } catch (err) {
        console.error('Error in ResolveWorkflow:', err)
        setIsPublishing(false)
      }
    },
  }
}
