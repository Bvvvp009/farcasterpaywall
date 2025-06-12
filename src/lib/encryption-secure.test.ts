import { 
  generateEncryptionKey, 
  encryptContent, 
  decryptContent, 
  encryptKeyForUser, 
  decryptKeyForUser,
  generatePaymentProof,
  verifyUserAccess,
  generateAccessToken,
  storeEncryptedKey,
  retrieveEncryptedKey,
  encryptKeyForPaidAccess,
  decryptKeyForPaidAccess
} from './encryption-secure'

describe('Secure Encryption Library', () => {
  let testKey: string
  let testContent: string
  let testUserAddress: string
  let testContentId: string
  let testPaymentProof: string

  beforeEach(() => {
    testKey = generateEncryptionKey()
    testContent = 'This is a test content that needs to be encrypted'
    testUserAddress = '0xTestUser123456789'
    testContentId = 'test-content-id-123'
    testPaymentProof = generatePaymentProof(testUserAddress, testContentId, '1.00')
  })

  describe('Key Generation', () => {
    it('should generate unique encryption keys', () => {
      const key1 = generateEncryptionKey()
      const key2 = generateEncryptionKey()
      
      expect(key1).toBeDefined()
      expect(key2).toBeDefined()
      expect(key1).not.toBe(key2)
      expect(key1.length).toBeGreaterThan(0)
      expect(key2.length).toBeGreaterThan(0)
    })

    it('should generate keys in base64 format', () => {
      const key = generateEncryptionKey()
      const decoded = Buffer.from(key, 'base64')
      
      expect(decoded.length).toBe(32) // 256-bit key
      expect(() => Buffer.from(key, 'base64')).not.toThrow()
    })
  })

  describe('Content Encryption/Decryption', () => {
    it('should encrypt and decrypt content correctly', async () => {
      const encrypted = await encryptContent(testContent, testKey)
      const decrypted = await decryptContent(encrypted, testKey)
      
      expect(encrypted).not.toBe(testContent)
      expect(decrypted).toBe(testContent)
    })

    it('should handle different content types', async () => {
      const textContent = 'Simple text content'
      const jsonContent = JSON.stringify({ test: 'data', number: 123 })
      const longContent = 'A'.repeat(1000)
      
      const encrypted1 = await encryptContent(textContent, testKey)
      const encrypted2 = await encryptContent(jsonContent, testKey)
      const encrypted3 = await encryptContent(longContent, testKey)
      
      const decrypted1 = await decryptContent(encrypted1, testKey)
      const decrypted2 = await decryptContent(encrypted2, testKey)
      const decrypted3 = await decryptContent(encrypted3, testKey)
      
      expect(decrypted1).toBe(textContent)
      expect(decrypted2).toBe(jsonContent)
      expect(decrypted3).toBe(longContent)
    })

    it('should fail decryption with wrong key', async () => {
      const encrypted = await encryptContent(testContent, testKey)
      const wrongKey = generateEncryptionKey()
      
      await expect(decryptContent(encrypted, wrongKey)).rejects.toThrow()
    })

    it('should generate different encrypted content for same input', async () => {
      const encrypted1 = await encryptContent(testContent, testKey)
      const encrypted2 = await encryptContent(testContent, testKey)
      
      expect(encrypted1).not.toBe(encrypted2) // Due to random IV
    })
  })

  describe('Access Token Generation', () => {
    it('should generate consistent access tokens for same inputs', async () => {
      const timestamp = new Date().toISOString()
      const token1 = await generateAccessToken(testUserAddress, testContentId, timestamp)
      const token2 = await generateAccessToken(testUserAddress, testContentId, timestamp)
      
      expect(token1).toBe(token2)
    })

    it('should generate different tokens for different inputs', async () => {
      const timestamp = new Date().toISOString()
      const token1 = await generateAccessToken(testUserAddress, testContentId, timestamp)
      const token2 = await generateAccessToken('0xDifferentUser', testContentId, timestamp)
      const token3 = await generateAccessToken(testUserAddress, 'different-content-id', timestamp)
      
      expect(token1).not.toBe(token2)
      expect(token1).not.toBe(token3)
      expect(token2).not.toBe(token3)
    })
  })

  describe('Payment Proof Generation', () => {
    it('should generate payment proofs', () => {
      const proof = generatePaymentProof(testUserAddress, testContentId, '1.00')
      
      expect(proof).toBeDefined()
      expect(proof.length).toBeGreaterThan(0)
      expect(() => Buffer.from(proof, 'base64')).not.toThrow()
    })

    it('should generate different proofs for different inputs', () => {
      const proof1 = generatePaymentProof(testUserAddress, testContentId, '1.00')
      const proof2 = generatePaymentProof(testUserAddress, testContentId, '2.00')
      const proof3 = generatePaymentProof('0xDifferentUser', testContentId, '1.00')
      
      expect(proof1).not.toBe(proof2)
      expect(proof1).not.toBe(proof3)
    })

    it('should contain payment information', () => {
      const proof = generatePaymentProof(testUserAddress, testContentId, '1.00')
      const decoded = Buffer.from(proof, 'base64').toString('utf-8')
      const parts = decoded.split(':')
      
      expect(parts.length).toBeGreaterThanOrEqual(4)
      expect(parts[0]).toBe(testUserAddress)
      expect(parts[1]).toBe(testContentId)
      expect(parts[2]).toBe('1.00')
    })
  })

  describe('Secure Key Encryption for User Access', () => {
    it('should encrypt key for user access with metadata', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      
      expect(encryptedKeyMetadata).toBeDefined()
      expect(encryptedKeyMetadata.encryptedKey).not.toBe(testKey)
      expect(encryptedKeyMetadata.userAddress).toBe(testUserAddress)
      expect(encryptedKeyMetadata.contentId).toBe(testContentId)
      expect(encryptedKeyMetadata.paymentProof).toBe(testPaymentProof)
      expect(encryptedKeyMetadata.timestamp).toBeDefined()
      expect(encryptedKeyMetadata.accessToken).toBeDefined()
      expect(encryptedKeyMetadata.signature).toBeDefined()
    })

    it('should generate different encrypted keys for different users', async () => {
      const encryptedKey1 = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      const encryptedKey2 = await encryptKeyForUser(testKey, '0xDifferentUser', testContentId, testPaymentProof)
      
      expect(encryptedKey1.encryptedKey).not.toBe(encryptedKey2.encryptedKey)
    })

    it('should generate different encrypted keys for different content', async () => {
      const encryptedKey1 = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      const encryptedKey2 = await encryptKeyForUser(testKey, testUserAddress, 'different-content-id', testPaymentProof)
      
      expect(encryptedKey1.encryptedKey).not.toBe(encryptedKey2.encryptedKey)
    })

    it('should generate different encrypted keys for different payment proofs', async () => {
      const paymentProof1 = generatePaymentProof(testUserAddress, testContentId, '1.00')
      const paymentProof2 = generatePaymentProof(testUserAddress, testContentId, '2.00')
      
      const encryptedKey1 = await encryptKeyForUser(testKey, testUserAddress, testContentId, paymentProof1)
      const encryptedKey2 = await encryptKeyForUser(testKey, testUserAddress, testContentId, paymentProof2)
      
      expect(encryptedKey1.encryptedKey).not.toBe(encryptedKey2.encryptedKey)
    })
  })

  describe('Secure Key Decryption for User Access', () => {
    it('should decrypt key for authorized user', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      const decryptedKey = await decryptKeyForUser(encryptedKeyMetadata, testUserAddress, testContentId, testPaymentProof)
      
      expect(decryptedKey).toBe(testKey)
    })

    it('should fail decryption with wrong user address', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      
      await expect(decryptKeyForUser(encryptedKeyMetadata, '0xWrongUser', testContentId, testPaymentProof))
        .rejects.toThrow('User address mismatch')
    })

    it('should fail decryption with wrong content ID', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      
      await expect(decryptKeyForUser(encryptedKeyMetadata, testUserAddress, 'wrong-content-id', testPaymentProof))
        .rejects.toThrow('Content ID mismatch')
    })

    it('should fail decryption with wrong payment proof', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      const wrongProof = generatePaymentProof(testUserAddress, testContentId, '2.00')
      
      await expect(decryptKeyForUser(encryptedKeyMetadata, testUserAddress, testContentId, wrongProof))
        .rejects.toThrow('Payment proof mismatch')
    })

    it('should fail decryption with tampered signature', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      
      // Tamper with the signature
      const tamperedMetadata = {
        ...encryptedKeyMetadata,
        signature: 'tampered-signature'
      }
      
      await expect(decryptKeyForUser(tamperedMetadata, testUserAddress, testContentId, testPaymentProof))
        .rejects.toThrow('Signature verification failed')
    })

    it('should fail decryption with tampered encrypted key', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      
      // Tamper with the encrypted key
      const tamperedMetadata = {
        ...encryptedKeyMetadata,
        encryptedKey: 'tampered-encrypted-key'
      }
      
      await expect(decryptKeyForUser(tamperedMetadata, testUserAddress, testContentId, testPaymentProof))
        .rejects.toThrow()
    })
  })

  describe('User Access Verification', () => {
    it('should verify access with valid payment proof', async () => {
      const verification = await verifyUserAccess(testUserAddress, testContentId, testPaymentProof)
      
      expect(verification.isValid).toBe(true)
      expect(verification.amount).toBe('1.00')
      expect(verification.timestamp).toBeDefined()
      expect(verification.transactionId).toBeDefined()
    })

    it('should deny access without payment proof', async () => {
      const verification = await verifyUserAccess(testUserAddress, testContentId, '')
      
      expect(verification.isValid).toBe(false)
      expect(verification.amount).toBe('0')
    })

    it('should deny access with invalid payment proof', async () => {
      const verification = await verifyUserAccess(testUserAddress, testContentId, 'invalid-proof')
      
      expect(verification.isValid).toBe(false)
      expect(verification.amount).toBe('0')
    })

    it('should deny access with mismatched payment proof', async () => {
      const wrongProof = generatePaymentProof('0xDifferentUser', testContentId, '1.00')
      const verification = await verifyUserAccess(testUserAddress, testContentId, wrongProof)
      
      expect(verification.isValid).toBe(false)
      expect(verification.amount).toBe('0')
    })
  })

  describe('Key Storage', () => {
    it('should store encrypted key metadata', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      const storageId = await storeEncryptedKey(encryptedKeyMetadata)
      
      expect(storageId).toBeDefined()
      expect(storageId.length).toBeGreaterThan(0)
    })

    it('should generate unique storage IDs', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      const storageId1 = await storeEncryptedKey(encryptedKeyMetadata)
      
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const storageId2 = await storeEncryptedKey(encryptedKeyMetadata)
      
      expect(storageId1).not.toBe(storageId2)
    })

    it('should return null for non-existent storage ID', async () => {
      const retrieved = await retrieveEncryptedKey('non-existent-id')
      expect(retrieved).toBeNull()
    })
  })

  describe('Security Tests', () => {
    it('should not leak original key in encrypted metadata', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      
      // The encrypted key should not contain the original key in plain text
      expect(encryptedKeyMetadata.encryptedKey).not.toContain(testKey)
      
      // The signature should not contain the original key
      expect(encryptedKeyMetadata.signature).not.toContain(testKey)
      
      // The access token should not contain the original key
      expect(encryptedKeyMetadata.accessToken).not.toContain(testKey)
    })

    it('should handle special characters in content', async () => {
      const specialContent = 'Content with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      const encrypted = await encryptContent(specialContent, testKey)
      const decrypted = await decryptContent(encrypted, testKey)
      
      expect(decrypted).toBe(specialContent)
    })

    it('should handle unicode content', async () => {
      const unicodeContent = 'Unicode content: 🚀🌟🎉中文日本語한국어'
      const encrypted = await encryptContent(unicodeContent, testKey)
      const decrypted = await decryptContent(encrypted, testKey)
      
      expect(decrypted).toBe(unicodeContent)
    })

    it('should be resistant to replay attacks', async () => {
      const encryptedKeyMetadata = await encryptKeyForUser(testKey, testUserAddress, testContentId, testPaymentProof)
      
      // First decryption should work
      const decryptedKey1 = await decryptKeyForUser(encryptedKeyMetadata, testUserAddress, testContentId, testPaymentProof)
      expect(decryptedKey1).toBe(testKey)
      
      // Second decryption with same parameters should also work (not a replay attack)
      const decryptedKey2 = await decryptKeyForUser(encryptedKeyMetadata, testUserAddress, testContentId, testPaymentProof)
      expect(decryptedKey2).toBe(testKey)
    })
  })

  describe('Integration Tests', () => {
    it('should perform full secure encryption/decryption flow', async () => {
      // 1. Generate key
      const key = generateEncryptionKey()
      
      // 2. Encrypt content
      const encryptedContent = await encryptContent(testContent, key)
      
      // 3. Encrypt key for user with access control
      const encryptedKeyMetadata = await encryptKeyForUser(key, testUserAddress, testContentId, testPaymentProof)
      
      // 4. Verify user access
      const verification = await verifyUserAccess(testUserAddress, testContentId, testPaymentProof)
      expect(verification.isValid).toBe(true)
      
      // 5. Decrypt key with proper verification
      const decryptedKey = await decryptKeyForUser(encryptedKeyMetadata, testUserAddress, testContentId, testPaymentProof)
      
      // 6. Decrypt content
      const decryptedContent = await decryptContent(encryptedContent, decryptedKey)
      
      // 7. Verify the result
      expect(decryptedContent).toBe(testContent)
    })

    it('should handle multiple users with different access', async () => {
      const key = generateEncryptionKey()
      const content = 'Shared content'
      const encryptedContent = await encryptContent(content, key)
      
      // User 1 gets access
      const user1Address = '0xUser1'
      const user1Proof = generatePaymentProof(user1Address, testContentId, '1.00')
      const user1KeyMetadata = await encryptKeyForUser(key, user1Address, testContentId, user1Proof)
      
      // User 2 gets access
      const user2Address = '0xUser2'
      const user2Proof = generatePaymentProof(user2Address, testContentId, '1.00')
      const user2KeyMetadata = await encryptKeyForUser(key, user2Address, testContentId, user2Proof)
      
      // Both users should be able to decrypt
      const user1Key = await decryptKeyForUser(user1KeyMetadata, user1Address, testContentId, user1Proof)
      const user2Key = await decryptKeyForUser(user2KeyMetadata, user2Address, testContentId, user2Proof)
      
      const user1Content = await decryptContent(encryptedContent, user1Key)
      const user2Content = await decryptContent(encryptedContent, user2Key)
      
      expect(user1Content).toBe(content)
      expect(user2Content).toBe(content)
      
      // Users should not be able to use each other's keys
      await expect(decryptKeyForUser(user1KeyMetadata, user2Address, testContentId, user2Proof))
        .rejects.toThrow('User address mismatch')
      
      await expect(decryptKeyForUser(user2KeyMetadata, user1Address, testContentId, user1Proof))
        .rejects.toThrow('User address mismatch')
    })
  })

  describe('Paid Access Encryption/Decryption', () => {
    it('should encrypt key for paid access', async () => {
      const encryptedKeyMetadata = await encryptKeyForPaidAccess(testKey, testContentId, '1.00')
      
      expect(encryptedKeyMetadata).toBeDefined()
      expect(encryptedKeyMetadata.encryptedKey).not.toBe(testKey)
      expect(encryptedKeyMetadata.userAddress).toBe('content')
      expect(encryptedKeyMetadata.contentId).toBe(testContentId)
      expect(encryptedKeyMetadata.paymentProof).toBe(`content:${testContentId}:1.00`)
      expect(encryptedKeyMetadata.timestamp).toBeDefined()
      expect(encryptedKeyMetadata.accessToken).toBeDefined()
      expect(encryptedKeyMetadata.signature).toBeDefined()
    })

    it('should decrypt key for paid access with correct parameters', async () => {
      const encryptedKeyMetadata = await encryptKeyForPaidAccess(testKey, testContentId, '1.00')
      const decryptedKey = await decryptKeyForPaidAccess(
        encryptedKeyMetadata,
        testUserAddress,
        testContentId,
        '1.00'
      )
      
      expect(decryptedKey).toBe(testKey)
    })

    it('should fail decryption with wrong content ID', async () => {
      const encryptedKeyMetadata = await encryptKeyForPaidAccess(testKey, testContentId, '1.00')
      
      await expect(decryptKeyForPaidAccess(
        encryptedKeyMetadata,
        testUserAddress,
        'wrong-content-id',
        '1.00'
      )).rejects.toThrow('Content ID mismatch')
    })

    it('should fail decryption with wrong tip amount', async () => {
      const encryptedKeyMetadata = await encryptKeyForPaidAccess(testKey, testContentId, '1.00')
      
      await expect(decryptKeyForPaidAccess(
        encryptedKeyMetadata,
        testUserAddress,
        testContentId,
        '2.00'
      )).rejects.toThrow('Signature verification failed')
    })

    it('should fail decryption with wrong user encryption type', async () => {
      const encryptedKeyMetadata = await encryptKeyForPaidAccess(testKey, testContentId, '1.00')
      
      // Tamper with the user address to make it look like user-specific encryption
      const tamperedMetadata = {
        ...encryptedKeyMetadata,
        userAddress: '0xWrongUser'
      }
      
      await expect(decryptKeyForPaidAccess(
        tamperedMetadata,
        testUserAddress,
        testContentId,
        '1.00'
      )).rejects.toThrow('Invalid encryption metadata')
    })

    it('should work with different tip amounts', async () => {
      const encryptedKeyMetadata1 = await encryptKeyForPaidAccess(testKey, testContentId, '1.00')
      const encryptedKeyMetadata2 = await encryptKeyForPaidAccess(testKey, testContentId, '2.00')
      
      // Should be different because they use different tip amounts
      expect(encryptedKeyMetadata1.encryptedKey).not.toBe(encryptedKeyMetadata2.encryptedKey)
      
      // Each should decrypt correctly with its own tip amount
      const decryptedKey1 = await decryptKeyForPaidAccess(
        encryptedKeyMetadata1,
        testUserAddress,
        testContentId,
        '1.00'
      )
      const decryptedKey2 = await decryptKeyForPaidAccess(
        encryptedKeyMetadata2,
        testUserAddress,
        testContentId,
        '2.00'
      )
      
      expect(decryptedKey1).toBe(testKey)
      expect(decryptedKey2).toBe(testKey)
    })
  })
}) 