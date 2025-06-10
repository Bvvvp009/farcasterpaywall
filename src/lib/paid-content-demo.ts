/**
 * Paid Content System Demo
 * 
 * This script demonstrates the complete flow of the paid content system:
 * 1. Upload encrypted content
 * 2. Record payment
 * 3. Retrieve content
 * 4. Verify payment
 * 5. Decrypt content
 */

import { 
  generateEncryptionKey, 
  encryptContent, 
  decryptContent, 
  encryptKeyForUser, 
  decryptKeyForUser,
  generatePaymentProof,
  verifyUserAccess
} from './encryption-secure'

interface ContentMetadata {
  title: string
  description: string
  contentType: string
  accessType: 'free' | 'paid'
  contentCid: string
  contentUrl: string
  encryptedContent?: string
  encryptionKey?: any
  creator: string
  tipAmount: string
  createdAt: string
  isEncrypted: boolean
}

export class PaidContentDemo {
  private contentStore: Map<string, ContentMetadata> = new Map()
  private paymentStore: Map<string, any> = new Map()

  /**
   * Demo 1: Upload encrypted content
   */
  async uploadEncryptedContent(
    content: string,
    userAddress: string,
    title: string,
    description: string
  ): Promise<{ contentId: string; metadata: ContentMetadata }> {
    console.log('=== UPLOADING ENCRYPTED CONTENT ===')
    
    // 1. Generate encryption key
    const key = generateEncryptionKey()
    console.log('✅ Generated encryption key')
    
    // 2. Encrypt content
    const encryptedContent = await encryptContent(content, key)
    console.log('✅ Content encrypted')
    
    // 3. Generate content ID (in real app, this would be IPFS CID)
    const contentId = `content_${Date.now()}`
    
    // 4. Generate payment proof
    const paymentProof = generatePaymentProof(userAddress, contentId, '1.00')
    console.log('✅ Generated payment proof')
    
    // 5. Encrypt key for user
    const encryptionKeyMetadata = await encryptKeyForUser(key, userAddress, contentId, paymentProof)
    console.log('✅ Key encrypted for user')
    
    // 6. Create metadata
    const metadata: ContentMetadata = {
      title,
      description,
      contentType: 'text',
      accessType: 'paid',
      contentCid: contentId,
      contentUrl: `https://example.com/content/${contentId}`,
      encryptedContent,
      encryptionKey: encryptionKeyMetadata,
      creator: userAddress,
      tipAmount: '1.00',
      createdAt: new Date().toISOString(),
      isEncrypted: true
    }
    
    // 7. Store content
    this.contentStore.set(contentId, metadata)
    console.log('✅ Content stored')
    
    return { contentId, metadata }
  }

  /**
   * Demo 2: Record payment
   */
  async recordPayment(contentId: string, userAddress: string, amount: string): Promise<void> {
    console.log('=== RECORDING PAYMENT ===')
    
    const paymentData = {
      contentId,
      userAddress,
      txHash: `0x${Date.now().toString(16).padStart(64, '0')}`,
      amount,
      timestamp: Math.floor(Date.now() / 1000)
    }
    
    const paymentKey = `payment:${contentId}:${userAddress.toLowerCase()}`
    this.paymentStore.set(paymentKey, paymentData)
    console.log('✅ Payment recorded')
  }

  /**
   * Demo 3: Check payment status
   */
  async checkPaymentStatus(contentId: string, userAddress: string): Promise<boolean> {
    console.log('=== CHECKING PAYMENT STATUS ===')
    
    const paymentKey = `payment:${contentId}:${userAddress.toLowerCase()}`
    const payment = this.paymentStore.get(paymentKey)
    
    const hasPaid = !!payment
    console.log(`✅ Payment status: ${hasPaid ? 'PAID' : 'NOT PAID'}`)
    
    return hasPaid
  }

  /**
   * Demo 4: Retrieve and decrypt content
   */
  async retrieveAndDecryptContent(contentId: string, userAddress: string): Promise<string | null> {
    console.log('=== RETRIEVING AND DECRYPTING CONTENT ===')
    
    // 1. Get content metadata
    const metadata = this.contentStore.get(contentId)
    if (!metadata) {
      console.log('❌ Content not found')
      return null
    }
    
    console.log('✅ Content metadata retrieved')
    
    // 2. Check if content is encrypted
    if (!metadata.isEncrypted) {
      console.log('✅ Content is not encrypted, returning as-is')
      return metadata.encryptedContent || null
    }
    
    // 3. Check payment status
    const hasPaid = await this.checkPaymentStatus(contentId, userAddress)
    if (!hasPaid) {
      console.log('❌ Payment required to access this content')
      return null
    }
    
    // 4. Generate payment proof for decryption
    const paymentProof = generatePaymentProof(userAddress, contentId, metadata.tipAmount)
    console.log('✅ Generated payment proof for decryption')
    
    // 5. Decrypt the key
    const decryptedKey = await decryptKeyForUser(
      metadata.encryptionKey,
      userAddress,
      contentId,
      paymentProof
    )
    console.log('✅ Key decrypted')
    
    // 6. Decrypt the content
    const decryptedContent = await decryptContent(metadata.encryptedContent!, decryptedKey)
    console.log('✅ Content decrypted')
    
    return decryptedContent
  }

  /**
   * Demo 5: Security test - unauthorized access
   */
  async testUnauthorizedAccess(contentId: string, userAddress: string): Promise<void> {
    console.log('=== TESTING UNAUTHORIZED ACCESS ===')
    
    const metadata = this.contentStore.get(contentId)
    if (!metadata || !metadata.isEncrypted) {
      console.log('❌ No encrypted content found')
      return
    }
    
    // Test 1: Try to decrypt without payment
    console.log('Test 1: Decrypting without payment...')
    try {
      const paymentProof = generatePaymentProof(userAddress, contentId, '0.00')
      await decryptKeyForUser(
        metadata.encryptionKey,
        userAddress,
        contentId,
        paymentProof
      )
      console.log('❌ SECURITY FAILURE: Decryption succeeded without proper payment!')
    } catch (error) {
      console.log('✅ Security test passed: Decryption failed without proper payment')
    }
    
    // Test 2: Try to decrypt with wrong user
    console.log('Test 2: Decrypting with wrong user...')
    try {
      const wrongUser = '0xWrongUserAddress'
      const paymentProof = generatePaymentProof(wrongUser, contentId, '1.00')
      await decryptKeyForUser(
        metadata.encryptionKey,
        wrongUser,
        contentId,
        paymentProof
      )
      console.log('❌ SECURITY FAILURE: Decryption succeeded with wrong user!')
    } catch (error) {
      console.log('✅ Security test passed: Decryption failed with wrong user')
    }
    
    // Test 3: Try to decrypt with wrong payment proof
    console.log('Test 3: Decrypting with wrong payment proof...')
    try {
      const wrongProof = generatePaymentProof(userAddress, contentId, '2.00')
      await decryptKeyForUser(
        metadata.encryptionKey,
        userAddress,
        contentId,
        wrongProof
      )
      console.log('❌ SECURITY FAILURE: Decryption succeeded with wrong payment proof!')
    } catch (error) {
      console.log('✅ Security test passed: Decryption failed with wrong payment proof')
    }
  }

  /**
   * Demo 6: Complete end-to-end flow
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🚀 STARTING COMPLETE PAID CONTENT DEMO')
    console.log('=====================================')
    
    const userAddress = '0xTestUser123456789'
    const originalContent = 'This is my secret content that only paid users can see!'
    const title = 'Secret Document'
    const description = 'A confidential document requiring payment to access'
    
    try {
      // Step 1: Upload encrypted content
      const { contentId } = await this.uploadEncryptedContent(
        originalContent,
        userAddress,
        title,
        description
      )
      
      // Step 2: Record payment
      await this.recordPayment(contentId, userAddress, '1.00')
      
      // Step 3: Retrieve and decrypt content
      const decryptedContent = await this.retrieveAndDecryptContent(contentId, userAddress)
      
      // Step 4: Verify content matches
      if (decryptedContent === originalContent) {
        console.log('✅ SUCCESS: Content decrypted correctly!')
        console.log(`Original: "${originalContent}"`)
        console.log(`Decrypted: "${decryptedContent}"`)
      } else {
        console.log('❌ FAILURE: Content mismatch!')
        console.log(`Original: "${originalContent}"`)
        console.log(`Decrypted: "${decryptedContent}"`)
      }
      
      // Step 5: Test security
      await this.testUnauthorizedAccess(contentId, userAddress)
      
      console.log('=====================================')
      console.log('🎉 DEMO COMPLETED SUCCESSFULLY!')
      
    } catch (error) {
      console.error('❌ Demo failed:', error)
    }
  }

  /**
   * Demo 7: Multiple users with different access
   */
  async runMultiUserDemo(): Promise<void> {
    console.log('👥 STARTING MULTI-USER DEMO')
    console.log('============================')
    
    const creatorAddress = '0xCreator123456789'
    const user1Address = '0xUser1Address'
    const user2Address = '0xUser2Address'
    const content = 'Shared content for multiple users'
    
    try {
      // Upload content
      const { contentId } = await this.uploadEncryptedContent(
        content,
        creatorAddress,
        'Multi-User Content',
        'Content accessible by multiple paid users'
      )
      
      // User 1 pays and gets access
      await this.recordPayment(contentId, user1Address, '1.00')
      const user1Content = await this.retrieveAndDecryptContent(contentId, user1Address)
      console.log(`User 1 access: ${user1Content === content ? '✅ SUCCESS' : '❌ FAILED'}`)
      
      // User 2 doesn't pay, should not get access
      const user2Content = await this.retrieveAndDecryptContent(contentId, user2Address)
      console.log(`User 2 access (no payment): ${user2Content === null ? '✅ BLOCKED' : '❌ FAILED'}`)
      
      // User 2 pays and gets access
      await this.recordPayment(contentId, user2Address, '1.00')
      const user2ContentAfterPayment = await this.retrieveAndDecryptContent(contentId, user2Address)
      console.log(`User 2 access (after payment): ${user2ContentAfterPayment === content ? '✅ SUCCESS' : '❌ FAILED'}`)
      
      console.log('============================')
      console.log('🎉 MULTI-USER DEMO COMPLETED!')
      
    } catch (error) {
      console.error('❌ Multi-user demo failed:', error)
    }
  }
}

// Export a function to run the demo
export async function runPaidContentDemo(): Promise<void> {
  const demo = new PaidContentDemo()
  await demo.runCompleteDemo()
  await demo.runMultiUserDemo()
} 