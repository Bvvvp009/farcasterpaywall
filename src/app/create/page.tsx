'use client'

import { CreateContent } from '@/components/CreateContent'

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Create Paywalled Content this is a test added
        </h1>
        <CreateContent />
      </div>
    </main>
  )
} 