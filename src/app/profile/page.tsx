'use client'

import { UserProfile } from '@/components/UserProfile'

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-pink-800">
          Your Profile
        </h1>
        <UserProfile />
      </div>
    </main>
  )
} 