'use client'

import { CreatorSubscriptionSetup } from '../../components/CreatorSubscriptionSetup'

export default function SubscriptionSetupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">
          Set Up Your Subscription
        </h1>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-blue-100">
          <CreatorSubscriptionSetup />
        </div>
      </div>
    </main>
  )
} 