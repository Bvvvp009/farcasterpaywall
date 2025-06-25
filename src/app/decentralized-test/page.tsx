'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import DecentralizedContentAccess from '../../components/DecentralizedContentAccess'
import { 
  getFarcasterUserContext,
  getFarcasterWalletAddress
} from '../../lib/decentralized-payments'
import { 
  getUserPaymentHistory,
  getCreatorPaymentHistory,
  exportPaymentIndex,
  clearPaymentIndex
} from '../../lib/blockchain-indexer'
import { sdk } from '@farcaster/frame-sdk'

export default function DecentralizedTestPage() {
  const [userContext, setUserContext] = useState<any>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [creatorPayments, setCreatorPayments] = useState<any[]>([])
  const [indexData, setIndexData] = useState<any>(null)
  const { address: wagmiAddress } = useAccount()

  useEffect(() => {
    const initializeDecentralizedTest = async () => {
      try {
        // Check if we're in a Farcaster Mini App
        const miniAppCheck = await sdk.isInMiniApp()
        setIsMiniApp(miniAppCheck)

        if (miniAppCheck) {
          // Get Farcaster user context
          const context = await getFarcasterUserContext()
          setUserContext(context)

          // Get wallet address
          const farcasterAddress = await getFarcasterWalletAddress()
          const effectiveAddress = farcasterAddress || wagmiAddress || null
          setWalletAddress(effectiveAddress)

          if (effectiveAddress) {
            // Get payment history
            const history = await getUserPaymentHistory(effectiveAddress)
            setPaymentHistory(history)

            // Get creator payments (using a test creator address)
            const testCreator = '0x1234567890123456789012345678901234567890'
            const creatorHistory = await getCreatorPaymentHistory(testCreator)
            setCreatorPayments(creatorHistory)
          }
        }

        // Export current index data
        const exportedData = exportPaymentIndex()
        setIndexData(exportedData)
      } catch (error) {
        console.error('Error initializing decentralized test:', error)
      }
    }

    initializeDecentralizedTest()
  }, [wagmiAddress])

  const handleAccessGranted = (proof: any) => {
    console.log('Access granted with proof:', proof)
    // Refresh payment history
    if (walletAddress) {
      getUserPaymentHistory(walletAddress).then(setPaymentHistory)
    }
  }

  const handleClearIndex = async () => {
    clearPaymentIndex()
    setPaymentHistory([])
    setCreatorPayments([])
    setIndexData(exportPaymentIndex())
  }

  const handleComposeCast = async () => {
    try {
      await sdk.actions.composeCast({
        text: 'Testing decentralized payments in Farcaster! 🚀',
        embeds: [window.location.href]
      })
    } catch (error) {
      console.error('Error composing cast:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🚀 Decentralized Payment Test
          </h1>
          <p className="text-gray-600 mb-6">
            Testing Farcaster's native payment capabilities with on-chain verification
          </p>

          {/* Farcaster Context Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Farcaster Context</h3>
              <div className="text-sm text-blue-700">
                <p><strong>Mini App:</strong> {isMiniApp ? '✅ Yes' : '❌ No'}</p>
                {userContext && (
                  <>
                    <p><strong>FID:</strong> {userContext.fid}</p>
                    <p><strong>Username:</strong> {userContext.username || 'N/A'}</p>
                    <p><strong>Display Name:</strong> {userContext.displayName || 'N/A'}</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Wallet Info</h3>
              <div className="text-sm text-green-700">
                <p><strong>Address:</strong> {walletAddress || 'Not connected'}</p>
                <p><strong>Source:</strong> {walletAddress === wagmiAddress ? 'Wagmi' : 'Farcaster'}</p>
              </div>
            </div>
          </div>

          {/* Test Content */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Test Premium Content</h3>
            <p className="text-gray-600 mb-4">
              This is a test of the decentralized payment system. Try unlocking this content!
            </p>
            
            <DecentralizedContentAccess
              contentId="decentralized-test-content"
              creatorAddress="0x1234567890123456789012345678901234567890"
              tipAmount="0.01"
              onAccessGranted={handleAccessGranted}
              onError={(error) => console.error('Payment error:', error)}
            />
          </div>

          {/* Payment History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Your Payment History</h3>
              <div className="text-sm text-yellow-700">
                {paymentHistory.length === 0 ? (
                  <p>No payments found</p>
                ) : (
                  <ul className="space-y-1">
                    {paymentHistory.slice(0, 5).map((payment, index) => (
                      <li key={index}>
                        {payment.amount} USDC → {payment.toAddress.slice(0, 8)}...
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Creator Payments</h3>
              <div className="text-sm text-purple-700">
                {creatorPayments.length === 0 ? (
                  <p>No creator payments found</p>
                ) : (
                  <ul className="space-y-1">
                    {creatorPayments.slice(0, 5).map((payment, index) => (
                      <li key={index}>
                        {payment.amount} USDC from {payment.fromAddress.slice(0, 8)}...
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleComposeCast}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📢 Share Test
            </button>
            
            <button
              onClick={handleClearIndex}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Clear Index
            </button>
          </div>

          {/* Index Data */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Blockchain Index Data</h3>
            <div className="text-xs text-gray-600 overflow-auto max-h-40">
              <pre>{JSON.stringify(indexData, null, 2)}</pre>
            </div>
          </div>
        </div>

        {/* Decentralized Features */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🌟 Decentralized Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl mb-2">🔗</div>
              <h3 className="font-semibold text-blue-800">On-Chain Verification</h3>
              <p className="text-sm text-blue-600">
                All payments verified directly on the blockchain
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="font-semibold text-green-800">No Centralized DB</h3>
              <p className="text-sm text-green-600">
                Payment tracking through blockchain indexing
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-purple-800">Native Farcaster</h3>
              <p className="text-sm text-purple-600">
                Uses Farcaster's built-in payment system
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🚀 How It Works</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. User initiates payment via Farcaster's native sendToken action</li>
              <li>2. Transaction is executed on-chain (Base network)</li>
              <li>3. Transaction is indexed for future verification</li>
              <li>4. Content access is granted based on on-chain proof</li>
              <li>5. No centralized database required for payment tracking</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
} 