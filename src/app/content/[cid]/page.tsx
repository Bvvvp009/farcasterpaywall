'use client'

import ContentView from '../../../components/ContentView'
import { MiniAppFrameHandler } from '../../../components/MiniAppFrameHandler'
import { sdk } from '@farcaster/frame-sdk'
import { useEffect, useState } from 'react'

export default function ContentPage({ params }: { params: { cid: string } }) {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const miniApp = await sdk.isInMiniApp()
        setIsMiniApp(miniApp)
      } catch (error) {
        console.log('Not in Mini App environment')
        setIsMiniApp(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkEnvironment()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // If in Mini App environment, use the Mini App frame handler
  if (isMiniApp) {
    return <MiniAppFrameHandler contentId={params.cid} />
  }

  // Otherwise, use the regular content view
  return <ContentView />
} 