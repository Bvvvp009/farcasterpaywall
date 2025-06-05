'use client'

import { UserProfile } from '../../components/UserProfile'
import { useAccount } from 'wagmi'

export default function ProfilePage() {
  const { address } = useAccount()

  if (!address) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8 text-pink-800">
            Please connect your wallet to view your profile
          </h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-pink-800">
          Your Profile
        </h1>
        <UserProfile address={address} />
      </div>
    </main>
  )
} 