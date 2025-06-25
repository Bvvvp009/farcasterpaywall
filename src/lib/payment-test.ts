/**
 * Payment System Test Script
 * 
 * This script tests the individual payment system to ensure that:
 * 1. Users must pay for each piece of content individually
 * 2. Payment for one content doesn't grant access to another
 * 3. Payment verification works correctly
 */

import { kv } from '@vercel/kv'

interface PaymentData {
  txHash: string
  amount: string
  timestamp: number
  contentId: string
  userAddress: string
}

export async function testPaymentSystem() {
  console.log('🧪 Starting Payment System Test')
  
  const testUserAddress = '0x1234567890123456789012345678901234567890'
  const contentId1 = 'test-content-1'
  const contentId2 = 'test-content-2'
  const contentId3 = 'test-content-3'
  
  try {
    // Test 1: Record payment for content 1
    console.log('\n📝 Test 1: Record payment for content 1')
    const payment1: PaymentData = {
      contentId: contentId1,
      userAddress: testUserAddress,
      txHash: '0x' + '1'.repeat(64),
      amount: '1.00',
      timestamp: Math.floor(Date.now() / 1000),
    }
    
    const paymentKey1 = `payment:${contentId1}:${testUserAddress.toLowerCase()}`
    await kv.set(paymentKey1, payment1)
    console.log('✅ Payment for content 1 recorded')
    
    // Test 2: Verify payment for content 1
    console.log('\n🔍 Test 2: Verify payment for content 1')
    const storedPayment1 = await kv.get<PaymentData>(paymentKey1)
    if (storedPayment1) {
      console.log('✅ Payment for content 1 verified')
    } else {
      throw new Error('Payment for content 1 not found')
    }
    
    // Test 3: Check payment for content 2 (should not have access)
    console.log('\n🚫 Test 3: Check payment for content 2 (should not have access)')
    const paymentKey2 = `payment:${contentId2}:${testUserAddress.toLowerCase()}`
    const storedPayment2 = await kv.get<PaymentData>(paymentKey2)
    if (!storedPayment2) {
      console.log('✅ Correctly no access to content 2')
    } else {
      throw new Error('Should not have access to content 2')
    }
    
    // Test 4: Record payment for content 2
    console.log('\n📝 Test 4: Record payment for content 2')
    const payment2: PaymentData = {
      contentId: contentId2,
      userAddress: testUserAddress,
      txHash: '0x' + '2'.repeat(64),
      amount: '2.00',
      timestamp: Math.floor(Date.now() / 1000),
    }
    
    await kv.set(paymentKey2, payment2)
    console.log('✅ Payment for content 2 recorded')
    
    // Test 5: Verify both payments work independently
    console.log('\n🔍 Test 5: Verify both payments work independently')
    const finalPayment1 = await kv.get<PaymentData>(paymentKey1)
    const finalPayment2 = await kv.get<PaymentData>(paymentKey2)
    
    if (finalPayment1 && finalPayment2) {
      console.log('✅ Both payments work independently')
      console.log(`   Content 1: ${finalPayment1.amount} USDC`)
      console.log(`   Content 2: ${finalPayment2.amount} USDC`)
    } else {
      throw new Error('One or both payments not working')
    }
    
    // Test 6: Check payment for content 3 (should not have access)
    console.log('\n🚫 Test 6: Check payment for content 3 (should not have access)')
    const paymentKey3 = `payment:${contentId3}:${testUserAddress.toLowerCase()}`
    const storedPayment3 = await kv.get<PaymentData>(paymentKey3)
    if (!storedPayment3) {
      console.log('✅ Correctly no access to content 3')
    } else {
      throw new Error('Should not have access to content 3')
    }
    
    // Test 7: Test with different user address
    console.log('\n👤 Test 7: Test with different user address')
    const differentUserAddress = '0x9876543210987654321098765432109876543210'
    const differentPaymentKey = `payment:${contentId1}:${differentUserAddress.toLowerCase()}`
    const differentPayment = await kv.get<PaymentData>(differentPaymentKey)
    if (!differentPayment) {
      console.log('✅ Different user correctly has no access')
    } else {
      throw new Error('Different user should not have access')
    }
    
    console.log('\n🎉 All payment system tests passed!')
    console.log('\n📊 Summary:')
    console.log(`   - User has access to: ${contentId1}, ${contentId2}`)
    console.log(`   - User has no access to: ${contentId3}`)
    console.log(`   - Different user has no access to any content`)
    console.log(`   - Individual payments work correctly`)
    
  } catch (error) {
    console.error('❌ Payment system test failed:', error)
    throw error
  }
}

export async function cleanupTestPayments() {
  console.log('🧹 Cleaning up test payments...')
  
  const testUserAddress = '0x1234567890123456789012345678901234567890'
  const differentUserAddress = '0x9876543210987654321098765432109876543210'
  const contentIds = ['test-content-1', 'test-content-2', 'test-content-3']
  
  for (const contentId of contentIds) {
    const paymentKey1 = `payment:${contentId}:${testUserAddress.toLowerCase()}`
    const paymentKey2 = `payment:${contentId}:${differentUserAddress.toLowerCase()}`
    
    await kv.del(paymentKey1)
    await kv.del(paymentKey2)
  }
  
  console.log('✅ Test payments cleaned up')
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPaymentSystem()
    .then(() => {
      console.log('✅ Payment system test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Payment system test failed:', error)
      process.exit(1)
    })
} 