import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'

interface FrameHandlerProps {
  cid: string
  onFrameAction: (action: 'view' | 'pay') => void
}

interface FrameActionEvent {
  buttonIndex: number
  fid: number
}

export function FrameHandler({ cid, onFrameAction }: FrameHandlerProps) {
  const [isFrame, setIsFrame] = useState(false)

  useEffect(() => {
    // Check if we're in a frame context
    const checkFrame = async () => {
      const isInFrame = await sdk.isInMiniApp()
      setIsFrame(isInFrame)
      
      if (isInFrame) {
        // Hide splash screen when ready
        await sdk.actions.ready()
        
        // Listen for frame button clicks
        const handleFrameAction = async (event: FrameActionEvent) => {
          if (event.buttonIndex === 1) {
            // Handle the frame action
            const response = await fetch('/api/frame', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                cid,
                buttonIndex: event.buttonIndex,
                fid: event.fid,
              }),
            })

            const data = await response.json()
            
            if (data.frame) {
              // Handle the frame response
              if (data.frame.buttons?.[0]?.action === 'post_redirect') {
                const target = data.frame.buttons[0].target
                if (target.includes('/pay')) {
                  onFrameAction('pay')
                } else {
                  onFrameAction('view')
                }
              }
            }
          }
        }

        // Add event listener for frame actions
        window.addEventListener('message', (event) => {
          if (event.data?.type === 'frame-action') {
            handleFrameAction(event.data as FrameActionEvent)
          }
        })
      }
    }

    checkFrame()

    // Cleanup
    return () => {
      window.removeEventListener('message', () => {})
    }
  }, [cid, onFrameAction])

  // This component doesn't render anything
  return null
} 