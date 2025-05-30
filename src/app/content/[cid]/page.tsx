'use client'

import { ContentView } from '@/components/ContentView'

type ContentPageProps = {
  params: {
    cid: string
  }
}

export default function ContentPage({ params }: ContentPageProps) {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ContentView metadataCid={params.cid} />
      </div>
    </main>
  )
} 