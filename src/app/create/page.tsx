'use client'

import dynamic from 'next/dynamic'

const CreateContent = dynamic(() => import('../../components/CreateContent'), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading...</div>
})

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-pink-800">
          Create Paywalled Content
        </h1>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-pink-100">
          <CreateContent />
        </div>
      </div>
    </main>
  )
} 