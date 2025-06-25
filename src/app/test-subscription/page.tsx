'use client'

import { SubscriptionTest } from '../../components/SubscriptionTest'

export default function TestSubscriptionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">
          Subscription System Test
        </h1>
        <SubscriptionTest />
      </div>
    </main>
  )
} 