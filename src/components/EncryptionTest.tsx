'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { 
  generateEncryptionKey, 
  encryptContent, 
  decryptContent, 
  encryptKeyForPaidAccess,
  decryptKeyForPaidAccess
} from '../lib/encryption-secure'

export function EncryptionTest() {
  const { address } = useAccount()
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const runEncryptionTest = async () => {
    if (!address) {
      addResult('❌ No wallet connected')
      return
    }

    setIsRunning(true)
    clearResults()
    
    try {
      addResult('🚀 Starting Encryption/Decryption Test')
      
      // Test 1: Basic encryption/decryption
      addResult('📝 Test 1: Basic encryption/decryption')
      const testContent = 'This is a secret message that should be encrypted!'
      const encryptionKey = generateEncryptionKey()
      const encryptedContent = await encryptContent(testContent, encryptionKey)
      const decryptedContent = await decryptContent(encryptedContent, encryptionKey)
      
      if (decryptedContent === testContent) {
        addResult('✅ Basic encryption/decryption works correctly')
      } else {
        addResult('❌ Basic encryption/decryption failed')
        return
      }

      // Test 2: Content-specific key encryption
      addResult('🔐 Test 2: Content-specific key encryption')
      const contentId1 = 'test-content-1'
      const contentId2 = 'test-content-2'
      const tipAmount = '1.00'
      
      const encryptedKey1 = await encryptKeyForPaidAccess(encryptionKey, contentId1, tipAmount)
      const encryptedKey2 = await encryptKeyForPaidAccess(encryptionKey, contentId2, tipAmount)
      
      addResult('✅ Content-specific keys created')

      // Test 3: Decrypt with correct parameters
      addResult('🔓 Test 3: Decrypt with correct parameters')
      const decryptedKey1 = await decryptKeyForPaidAccess(encryptedKey1, address, contentId1, tipAmount)
      const decryptedContent1 = await decryptContent(encryptedContent, decryptedKey1)
      
      if (decryptedContent1 === testContent) {
        addResult('✅ Decryption with correct parameters works')
      } else {
        addResult('❌ Decryption with correct parameters failed')
        return
      }

      // Test 4: Decrypt with wrong content ID (should fail)
      addResult('🚫 Test 4: Decrypt with wrong content ID')
      try {
        await decryptKeyForPaidAccess(encryptedKey1, address, contentId2, tipAmount)
        addResult('❌ Decryption with wrong content ID should have failed')
        return
      } catch (error) {
        addResult('✅ Decryption with wrong content ID correctly failed')
      }

      // Test 5: Decrypt with wrong tip amount (should fail)
      addResult('🚫 Test 5: Decrypt with wrong tip amount')
      try {
        await decryptKeyForPaidAccess(encryptedKey1, address, contentId1, '2.00')
        addResult('❌ Decryption with wrong tip amount should have failed')
        return
      } catch (error) {
        addResult('✅ Decryption with wrong tip amount correctly failed')
      }

      // Test 6: Individual content isolation
      addResult('🔒 Test 6: Individual content isolation')
      const decryptedKey2 = await decryptKeyForPaidAccess(encryptedKey2, address, contentId2, tipAmount)
      const decryptedContent2 = await decryptContent(encryptedContent, decryptedKey2)
      
      if (decryptedContent2 === testContent) {
        addResult('✅ Individual content isolation works correctly')
      } else {
        addResult('❌ Individual content isolation failed')
        return
      }

      addResult('🎉 All encryption/decryption tests passed!')
      
    } catch (error) {
      addResult(`❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const runPaymentTest = async () => {
    if (!address) {
      addResult('❌ No wallet connected')
      return
    }

    setIsRunning(true)
    clearResults()
    
    try {
      addResult('💰 Starting Payment System Test')
      
      // Test 1: Record payment for content 1
      addResult('📝 Test 1: Record payment for content 1')
      const contentId1 = 'test-payment-content-1'
      const contentId2 = 'test-payment-content-2'
      
      const payment1Response = await fetch('/api/payments/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentId1,
          userAddress: address,
          txHash: '0x' + '1'.repeat(64),
          amount: '1.00',
          timestamp: Math.floor(Date.now() / 1000),
        }),
      })
      
      if (payment1Response.ok) {
        addResult('✅ Payment for content 1 recorded')
      } else {
        addResult('❌ Failed to record payment for content 1')
        return
      }

      // Test 2: Check payment for content 1
      addResult('🔍 Test 2: Check payment for content 1')
      const check1Response = await fetch('/api/payments/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentId1,
          userAddress: address,
        }),
      })
      
      if (check1Response.ok) {
        const check1Data = await check1Response.json()
        if (check1Data.hasPaid) {
          addResult('✅ Payment for content 1 verified')
        } else {
          addResult('❌ Payment for content 1 not found')
          return
        }
      } else {
        addResult('❌ Failed to check payment for content 1')
        return
      }

      // Test 3: Check payment for content 2 (should not have access)
      addResult('🚫 Test 3: Check payment for content 2 (should not have access)')
      const check2Response = await fetch('/api/payments/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentId2,
          userAddress: address,
        }),
      })
      
      if (check2Response.ok) {
        const check2Data = await check2Response.json()
        if (!check2Data.hasPaid) {
          addResult('✅ Correctly no access to content 2')
        } else {
          addResult('❌ Should not have access to content 2')
          return
        }
      } else {
        addResult('❌ Failed to check payment for content 2')
        return
      }

      // Test 4: Record payment for content 2
      addResult('📝 Test 4: Record payment for content 2')
      const payment2Response = await fetch('/api/payments/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentId2,
          userAddress: address,
          txHash: '0x' + '2'.repeat(64),
          amount: '2.00',
          timestamp: Math.floor(Date.now() / 1000),
        }),
      })
      
      if (payment2Response.ok) {
        addResult('✅ Payment for content 2 recorded')
      } else {
        addResult('❌ Failed to record payment for content 2')
        return
      }

      // Test 5: Verify both payments work independently
      addResult('🔍 Test 5: Verify both payments work independently')
      const finalCheck1Response = await fetch('/api/payments/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentId1,
          userAddress: address,
        }),
      })
      
      const finalCheck2Response = await fetch('/api/payments/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentId2,
          userAddress: address,
        }),
      })
      
      if (finalCheck1Response.ok && finalCheck2Response.ok) {
        const data1 = await finalCheck1Response.json()
        const data2 = await finalCheck2Response.json()
        
        if (data1.hasPaid && data2.hasPaid) {
          addResult('✅ Both payments work independently')
        } else {
          addResult('❌ One or both payments not working')
          return
        }
      } else {
        addResult('❌ Failed to verify independent payments')
        return
      }

      addResult('🎉 All payment system tests passed!')
      
    } catch (error) {
      addResult(`❌ Payment test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      addResult('🔄 Starting End-to-End Test')
      
      // Step 1: Create test content
      addResult('📝 Step 1: Create test content')
      const testContent = 'This is premium content that requires payment!'
      const contentId = 'e2e-test-content'
      const tipAmount = '1.00'
      
      // Step 2: Encrypt content
      addResult('🔐 Step 2: Encrypt content')
      const encryptionKey = generateEncryptionKey()
      const encryptedContent = await encryptContent(testContent, encryptionKey)
      const encryptedKeyMetadata = await encryptKeyForPaidAccess(encryptionKey, contentId, tipAmount)
      
      addResult('✅ Content encrypted successfully')

      // Step 3: Record payment
      addResult('💰 Step 3: Record payment')
      const paymentResponse = await fetch('/api/payments/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          userAddress: address,
          txHash: '0x' + 'e2e'.repeat(21),
          amount: tipAmount,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      })
      
      if (!paymentResponse.ok) {
        addResult('❌ Failed to record payment')
        return
      }
      addResult('✅ Payment recorded')

      // Step 4: Verify payment
      addResult('🔍 Step 4: Verify payment')
      const checkResponse = await fetch('/api/payments/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          userAddress: address,
        }),
      })
      
      if (!checkResponse.ok) {
        addResult('❌ Failed to check payment')
        return
      }
      
      const checkData = await checkResponse.json()
      if (!checkData.hasPaid) {
        addResult('❌ Payment verification failed')
        return
      }
      addResult('✅ Payment verified')

      // Step 5: Decrypt content
      addResult('🔓 Step 5: Decrypt content')
      const decryptedKey = await decryptKeyForPaidAccess(encryptedKeyMetadata, address, contentId, tipAmount)
      const decryptedContent = await decryptContent(encryptedContent, decryptedKey)
      
      if (decryptedContent === testContent) {
        addResult('✅ Content decrypted successfully')
      } else {
        addResult('❌ Content decryption failed')
        return
      }

      addResult('🎉 End-to-end test completed successfully!')
      
    } catch (error) {
      addResult(`❌ End-to-end test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Encryption & Payment System Test</h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This test suite verifies the encryption/decryption mechanism and individual payment system.
        </p>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={runEncryptionTest}
            disabled={isRunning || !address}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Encryption
          </button>
          
          <button
            onClick={runPaymentTest}
            disabled={isRunning || !address}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Payments
          </button>
          
          <button
            onClick={runEndToEndTest}
            disabled={isRunning || !address}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            End-to-End Test
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>
        
        {!address && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            Please connect your wallet to run tests
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <div className="max-h-96 overflow-y-auto space-y-1">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No test results yet. Run a test to see results.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 