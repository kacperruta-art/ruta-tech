import {useState} from 'react'
import {useDocumentOperation, useCurrentUser} from 'sanity'
import {Rocket} from 'lucide-react'

export function ApproveTicketAction(props: any) {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const currentUser = useCurrentUser()
  const [isProcessing, setIsProcessing] = useState(false)

  // Data access
  const doc = props.draft || props.published
  const isPending = doc?.status === 'pending_approval'

  if (props.type !== 'ticket' || !isPending) return null

  return {
    label: isProcessing ? 'Wird freigegeben...' : 'Freigeben & Beauftragen',
    icon: Rocket,
    tone: 'positive' as const,

    onHandle: async () => {
      setIsProcessing(true)

      // 1. Validation: Provider must be assigned
      if (!doc.assignedProvider) {
        alert(
          'Bitte waehlen Sie zuerst einen Dienstleister (Provider) aus.'
        )
        setIsProcessing(false)
        return
      }

      // 2. Update Document
      // NOTE: We store the approver's name/email as a string, NOT as a
      // reference. Sanity's currentUser.id is an internal system ID
      // (e.g. "pSMZvxePy"), not a document in the "user" collection.
      // Using it as a _ref causes "references non-existent document" errors.
      patch.execute([
        {set: {status: 'in_progress'}},
        {set: {approvedAt: new Date().toISOString()}},
        ...(currentUser
          ? [
              {
                set: {
                  approvedByName: currentUser.name || currentUser.email || 'Unknown',
                },
              },
            ]
          : []),
      ])

      publish.execute()
      props.onComplete()
    },
  }
}
