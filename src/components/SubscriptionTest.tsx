'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { 
  generateEncryptionKey, 
  encryptContent, 
  encryptKeyForSubscriptionAccess,
  decryptKeyForSubscriptionAccess,
  decryptContent
} from '../lib/encryption-secure'

export function SubscriptionTest() {
  const { address } = useAccount()
  const [results, setResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testCreatorAddress, setTestCreatorAddress] = useState('0x1234567890123456789012345678901234567890')
  const [testSubscriberAddress, setTestSubscriberAddress] = useState('0x0987654321098765432109876543210987654321')

  const addResult = (result: string) => {
    setResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
  }

  const runSubscriptionTest = async () => {
    if (!address) {
      addResult('❌ No wallet connected')
      return
    }

    setIsRunning(true)
    clearResults()
    
    try {
      addResult('🧪 Starting Subscription System Test')
      
      // Test 1: Create creator subscription
      addResult('📝 Test 1: Create creator subscription')
      const creatorSubscriptionResponse = await fetch('/api/subscriptions/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: testCreatorAddress,
          monthlyFee: '5.00',
          description: 'Test subscription for premium content',
          benefits: ['Access to all premium content', 'Exclusive updates', 'Early access to new features']
        }),
      })
      
      if (creatorSubscriptionResponse.ok) {
        addResult('✅ Creator subscription created')
      } else {
        addResult('❌ Failed to create creator subscription')
        return
      }

      // Test 2: Create subscriber subscription
      addResult('📝 Test 2: Create subscriber subscription')
      const subscriptionResponse = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: testCreatorAddress,
          subscriberAddress: testSubscriberAddress,
          monthlyFee: '5.00',
          txHash: '0x' + 'test'.repeat(16),
        }),
      })
      
      if (subscriptionResponse.ok) {
        addResult('✅ Subscriber subscription created')
      } else {
        addResult('❌ Failed to create subscriber subscription')
        return
      }

      // Test 3: Check subscription status
      addResult('🔍 Test 3: Check subscription status')
      const checkResponse = await fetch('/api/subscriptions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: testCreatorAddress,
          subscriberAddress: testSubscriberAddress,
        }),
      })
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        if (checkData.hasActiveSubscription) {
          addResult('✅ Subscription status verified')
        } else {
          addResult('❌ Subscription not found')
          return
        }
      } else {
        addResult('❌ Failed to check subscription status')
        return
      }

      // Test 4: Test subscription-based encryption/decryption
      addResult('🔐 Test 4: Test subscription-based encryption/decryption')
      const testContent = 'This is premium content that requires subscription access!'
      const contentId = 'test-subscription-content'
      
      // Generate encryption key
      const key = generateEncryptionKey()
      addResult('✅ Encryption key generated')
      
      // Encrypt content
      const encryptedContent = await encryptContent(testContent, key)
      addResult('✅ Content encrypted')
      
      // Encrypt key for subscription access
      const encryptedKeyMetadata = await encryptKeyForSubscriptionAccess(key, contentId, testCreatorAddress)
      addResult('✅ Key encrypted for subscription access')
      
      // Decrypt key using subscription access
      const decryptedKey = await decryptKeyForSubscriptionAccess(
        encryptedKeyMetadata,
        testCreatorAddress,
        contentId
      )
      addResult('✅ Key decrypted using subscription access')
      
      // Decrypt content
      const decryptedContent = await decryptContent(encryptedContent, decryptedKey)
      addResult('✅ Content decrypted')
      
      if (decryptedContent === testContent) {
        addResult('✅ Content matches original - encryption/decryption successful!')
      } else {
        addResult('❌ Content does not match original')
        return
      }

      // Test 5: Test access control (wrong creator)
      addResult('🚫 Test 5: Test access control (wrong creator)')
      try {
        await decryptKeyForSubscriptionAccess(
          encryptedKeyMetadata,
          '0xWrongCreatorAddress',
          contentId
        )
        addResult('❌ Should have failed with wrong creator address')
        return
      } catch (error) {
        addResult('✅ Correctly failed with wrong creator address')
      }

      // Test 6: Test access control (wrong content ID)
      addResult('🚫 Test 6: Test access control (wrong content ID)')
      try {
        await decryptKeyForSubscriptionAccess(
          encryptedKeyMetadata,
          testCreatorAddress,
          'wrong-content-id'
        )
        addResult('❌ Should have failed with wrong content ID')
        return
      } catch (error) {
        addResult('✅ Correctly failed with wrong content ID')
      }

      // Test 7: Cancel subscription
      addResult('📝 Test 7: Cancel subscription')
      const cancelResponse = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: testCreatorAddress,
          subscriberAddress: testSubscriberAddress,
        }),
      })
      
      if (cancelResponse.ok) {
        addResult('✅ Subscription cancelled')
      } else {
        addResult('❌ Failed to cancel subscription')
        return
      }

      // Test 8: Verify subscription is cancelled
      addResult('🔍 Test 8: Verify subscription is cancelled')
      const finalCheckResponse = await fetch('/api/subscriptions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: testCreatorAddress,
          subscriberAddress: testSubscriberAddress,
        }),
      })
      
      if (finalCheckResponse.ok) {
        const finalCheckData = await finalCheckResponse.json()
        if (!finalCheckData.hasActiveSubscription) {
          addResult('✅ Subscription correctly cancelled')
        } else {
          addResult('❌ Subscription still active after cancellation')
          return
        }
      } else {
        addResult('❌ Failed to check final subscription status')
        return
      }

      addResult('🎉 All subscription tests passed!')
      
    } catch (err) {
      console.error('Error in subscription test:', err)
      addResult(`❌ Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const runEndToEndTest = async () => {
    if (!address) {
      addResult('❌ No wallet connected')
      return
    }

    setIsRunning(true)
    clearResults()
    
    try {
      addResult('🔄 Starting End-to-End Subscription Test')
      
      // Step 1: Set up creator subscription
      addResult('📝 Step 1: Set up creator subscription')
      const creatorResponse = await fetch('/api/subscriptions/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: address,
          monthlyFee: '3.00',
          description: 'End-to-end test subscription',
          benefits: ['Access to all premium content', 'Exclusive updates']
        }),
      })
      
      if (!creatorResponse.ok) {
        addResult('❌ Failed to set up creator subscription')
        return
      }
      addResult('✅ Creator subscription set up')

      // Step 2: Create subscriber subscription
      addResult('📝 Step 2: Create subscriber subscription')
      const subscriptionResponse = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: address,
          subscriberAddress: address, // Using same address for test
          monthlyFee: '3.00',
          txHash: '0x' + 'e2e'.repeat(21),
        }),
      })
      
      if (!subscriptionResponse.ok) {
        addResult('❌ Failed to create subscription')
        return
      }
      addResult('✅ Subscription created')

      // Step 3: Create subscription-only content
      addResult('📝 Step 3: Create subscription-only content')
      const testContent = 'This is exclusive content for subscribers only!'
      const contentId = 'e2e-subscription-content'
      
      const key = generateEncryptionKey()
      const encryptedContent = await encryptContent(testContent, key)
      const encryptedKeyMetadata = await encryptKeyForSubscriptionAccess(key, contentId, address)
      
      addResult('✅ Subscription-only content created')

      // Step 4: Verify subscription access
      addResult('🔍 Step 4: Verify subscription access')
      const checkResponse = await fetch('/api/subscriptions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: address,
          subscriberAddress: address,
        }),
      })
      
      if (!checkResponse.ok) {
        addResult('❌ Failed to check subscription')
        return
      }
      
      const checkData = await checkResponse.json()
      if (!checkData.hasActiveSubscription) {
        addResult('❌ No active subscription found')
        return
      }
      addResult('✅ Subscription access verified')

      // Step 5: Decrypt subscription content
      addResult('🔐 Step 5: Decrypt subscription content')
      const decryptedKey = await decryptKeyForSubscriptionAccess(
        encryptedKeyMetadata,
        address,
        contentId
      )
      const decryptedContent = await decryptContent(encryptedContent, decryptedKey)
      
      if (decryptedContent === testContent) {
        addResult('✅ Content successfully decrypted with subscription access')
      } else {
        addResult('❌ Content decryption failed')
        return
      }

      // Step 6: Clean up
      addResult('🧹 Step 6: Clean up')
      const cancelResponse = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: address,
          subscriberAddress: address,
        }),
      })
      
      if (cancelResponse.ok) {
        addResult('✅ Subscription cancelled')
      } else {
        addResult('⚠️ Failed to cancel subscription (non-critical)')
      }

      addResult('🎉 End-to-end subscription test completed successfully!')
      
    } catch (err) {
      console.error('Error in end-to-end test:', err)
      addResult(`❌ End-to-end test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Subscription System Test</h2>

        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Creator Address
            </label>
            <input
              type="text"
              value={testCreatorAddress}
              onChange={(e) => setTestCreatorAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Subscriber Address
            </label>
            <input
              type="text"
              value={testSubscriberAddress}
              onChange={(e) => setTestSubscriberAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
            />
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={runSubscriptionTest}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running...' : 'Run Subscription Test'}
          </button>
          
          <button
            onClick={runEndToEndTest}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running...' : 'Run End-to-End Test'}
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Results
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Test Results</h3>
          {results.length === 0 ? (
            <p className="text-gray-500">No test results yet. Run a test to see results here.</p>
          ) : (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 