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
    tone: 'positive',

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
      patch.execute([
        {set: {status: 'in_progress'}},
        {set: {approvedAt: new Date().toISOString()}},
        // Track who approved it
        ...(currentUser
          ? [
              {
                set: {
                  approvedBy: {_type: 'reference', _ref: currentUser.id},
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
