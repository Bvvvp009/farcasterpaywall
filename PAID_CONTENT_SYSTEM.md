# Paid Content System Documentation

## Overview

The paid content system allows creators to upload encrypted content that can only be accessed by users who have paid for it. The system uses a combination of encryption, payment verification, and access control to ensure that only authorized users can decrypt and view the content.

## Architecture

### 1. Content Upload Flow

```
1. Creator uploads content
2. Content is encrypted with a unique key
3. Encryption key is encrypted for the creator with payment proof
4. Encrypted content and key metadata are stored in IPFS
5. Metadata is stored in local database
6. Payment is recorded for testing purposes
```

### 2. Content Retrieval Flow

```
1. User requests content by CID
2. System checks if content is encrypted
3. System verifies user's payment status
4. If paid, user can decrypt the content
5. If not paid, user is prompted to pay
```

## Key Components

### 1. Encryption System (`src/lib/encryption-secure.ts`)

#### Content Encryption
- Uses AES-256-GCM for content encryption
- Generates a unique 256-bit key for each piece of content
- Encrypts the actual content (images as base64, text as plain text)

#### Key Encryption for User Access
- Encrypts the content key for specific users
- Uses user address + payment proof + content ID to create a master key
- Includes metadata for verification (user address, content ID, payment proof, timestamp, signature)

#### Access Control
- Verifies user address matches
- Verifies content ID matches  
- Verifies payment proof matches
- Verifies cryptographic signature
- Only allows decryption if all checks pass

### 2. Payment System

#### Payment Recording (`/api/payments/record`)
```typescript
{
  contentId: string,
  userAddress: string,
  txHash: string,
  amount: string,
  timestamp: number
}
```

#### Payment Verification (`/api/payments/check`)
```typescript
{
  contentId: string,
  userAddress: string
}
```

Returns:
```typescript
{
  hasPaid: boolean
}
```

### 3. Content Storage

#### IPFS Storage
- **Encrypted Content**: Stored as a placeholder file (in production, this would be the actual encrypted content)
- **Metadata**: Contains all content information including encrypted content and key metadata

#### Database Storage
- Stores metadata for quick retrieval
- Includes payment status and access control information
- Links to IPFS content

## Security Features

### 1. Multi-Layer Encryption
- Content is encrypted with a unique key
- Key is encrypted for each authorized user
- Uses different encryption parameters for each user

### 2. Access Control
- User address verification
- Content ID verification
- Payment proof verification
- Cryptographic signature verification
- Timestamp validation

### 3. Payment Verification
- Server-side payment status checking
- Transaction hash verification
- Amount verification
- Timestamp validation

### 4. Replay Attack Protection
- Unique timestamps for each encryption
- Cryptographic signatures prevent tampering
- Payment proof includes transaction details

## Usage Examples

### 1. Uploading Encrypted Content

```typescript
// 1. Generate encryption key
const key = generateEncryptionKey()

// 2. Encrypt content
const encryptedContent = await encryptContent(originalContent, key)

// 3. Generate payment proof
const paymentProof = generatePaymentProof(userAddress, contentId, amount)

// 4. Encrypt key for user
const encryptedKeyMetadata = await encryptKeyForUser(key, userAddress, contentId, paymentProof)

// 5. Store content
const metadata = {
  encryptedContent,
  encryptionKey: encryptedKeyMetadata,
  accessType: 'paid',
  // ... other metadata
}
```

### 2. Retrieving and Decrypting Content

```typescript
// 1. Check payment status
const paymentResponse = await fetch('/api/payments/check', {
  method: 'POST',
  body: JSON.stringify({ contentId, userAddress })
})
const { hasPaid } = await paymentResponse.json()

// 2. If paid, decrypt content
if (hasPaid) {
  const paymentProof = generatePaymentProof(userAddress, contentId, amount)
  const decryptedKey = await decryptKeyForUser(
    encryptedKeyMetadata,
    userAddress,
    contentId,
    paymentProof
  )
  const decryptedContent = await decryptContent(encryptedContent, decryptedKey)
}
```

## Testing

### TestUpload Component

The `TestUpload` component provides comprehensive testing for:

1. **Upload Test**: Upload encrypted content and verify storage
2. **Retrieve Test**: Retrieve content and check payment status
3. **Decrypt Test**: Decrypt content with proper access controls
4. **Security Test**: Verify access controls work correctly
5. **Quick Test**: End-to-end encryption/decryption flow

### Security Tests

1. **No Payment Proof**: Should fail decryption
2. **Wrong User Address**: Should fail decryption
3. **Wrong Payment Proof**: Should fail decryption
4. **Correct Access**: Should succeed decryption

## Production Considerations

### 1. Payment Integration
- Replace test payment proofs with real payment system integration
- Verify transactions on blockchain
- Handle payment expiration and refunds

### 2. Key Management
- Use hardware security modules (HSM) for key storage
- Implement key rotation
- Add key backup and recovery

### 3. Access Control
- Implement role-based access control
- Add time-limited access
- Support for multiple payment tiers

### 4. Content Storage
- Store actual encrypted content in IPFS
- Implement content versioning
- Add content integrity verification

### 5. Performance
- Cache payment verification results
- Implement content delivery networks
- Optimize encryption/decryption operations

## API Endpoints

### Content Management
- `POST /api/content` - Store content metadata
- `GET /api/content/[cid]` - Retrieve content metadata

### Payment Management
- `POST /api/payments/record` - Record payment
- `POST /api/payments/check` - Check payment status

### Revenue Tracking
- `POST /api/content/update-revenue` - Update revenue information

## Error Handling

### Common Errors
1. **Payment Required**: User hasn't paid for content
2. **Access Denied**: User doesn't have permission
3. **Invalid Payment Proof**: Payment proof is invalid or expired
4. **Content Not Found**: Content doesn't exist
5. **Decryption Failed**: Encryption key is invalid

### Error Responses
```typescript
{
  error: string,
  code?: string,
  details?: any
}
```

## Monitoring and Logging

### Key Metrics
- Content upload success rate
- Payment verification success rate
- Decryption success rate
- Access control violations
- Payment fraud attempts

### Logging
- All encryption/decryption operations
- Payment verification attempts
- Access control decisions
- Error conditions and stack traces

## Security Best Practices

1. **Never store encryption keys in plain text**
2. **Always verify payment status server-side**
3. **Use cryptographically secure random number generation**
4. **Implement rate limiting for decryption attempts**
5. **Log all access attempts for audit purposes**
6. **Use HTTPS for all API communications**
7. **Implement proper session management**
8. **Regular security audits and penetration testing**

## Future Enhancements

1. **Multi-signature payments**: Require multiple approvals for high-value content
2. **Time-limited access**: Automatically expire access after a certain time
3. **Content watermarking**: Add invisible watermarks to prevent unauthorized sharing
4. **Blockchain-based access control**: Use smart contracts for access management
5. **Zero-knowledge proofs**: Prove payment without revealing transaction details
6. **Content streaming**: Support for streaming encrypted video content
7. **Offline access**: Allow limited offline access to paid content 