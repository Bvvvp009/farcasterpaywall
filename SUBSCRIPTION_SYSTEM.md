# Subscription System Documentation

## Overview

The subscription system extends the existing paid content platform to support monthly subscriptions similar to Patreon. Creators can set up subscription offerings that allow followers to pay a monthly fee for access to all their premium content.

## Key Features

### For Creators
- **Set up subscription offerings** with monthly fees, descriptions, and benefits
- **Create subscription-only content** that's only accessible to subscribers
- **Recurring revenue** from loyal followers
- **Manage subscription settings** and benefits

### For Subscribers
- **Subscribe to creators** with monthly USDC payments
- **Access all premium content** for the subscription period (30 days)
- **Easy payment** through Farcaster Mini App integration
- **Cancel anytime** to stop future charges

## Architecture

### 1. Subscription Management

```
1. Creator sets up subscription offering
2. Subscriber pays monthly fee via Farcaster
3. Subscription is recorded in database
4. Subscriber gets access to all creator's content for 30 days
5. Subscription can be renewed or cancelled
```

### 2. Content Access Control

```
1. Creator creates subscription-only content
2. Content is encrypted with subscription-based keys
3. System checks subscription status before decryption
4. Only active subscribers can decrypt and view content
5. Access expires when subscription ends
```

## Key Components

### 1. Subscription Library (`src/lib/subscription.ts`)

#### Core Functions
- `createSubscription()` - Create new subscription
- `checkSubscription()` - Verify subscription status
- `renewSubscription()` - Extend subscription period
- `cancelSubscription()` - Cancel subscription
- `setCreatorSubscription()` - Set up creator subscription offering
- `getCreatorSubscription()` - Get creator subscription details

#### Data Structures
```typescript
interface Subscription {
  id: string
  creatorAddress: string
  subscriberAddress: string
  monthlyFee: string
  startDate: number
  endDate: number
  status: 'active' | 'expired' | 'cancelled'
  txHash: string
  lastPaymentDate: number
  nextPaymentDate: number
}

interface CreatorSubscription {
  creatorAddress: string
  monthlyFee: string
  description: string
  benefits: string[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}
```

### 2. Subscription Encryption (`src/lib/encryption-secure.ts`)

#### New Functions
- `encryptKeyForSubscriptionAccess()` - Encrypt content key for subscription access
- `decryptKeyForSubscriptionAccess()` - Decrypt content key using subscription access

#### Security Features
- **Creator-specific keys**: Each creator has unique encryption parameters
- **Content ID binding**: Keys are bound to specific content IDs
- **Access control**: Only the creator can decrypt subscription keys
- **Signature verification**: Cryptographic signatures prevent tampering

### 3. API Endpoints

#### Subscription Management
- `POST /api/subscriptions/create` - Create new subscription
- `POST /api/subscriptions/check` - Check subscription status
- `POST /api/subscriptions/renew` - Renew subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

#### Creator Settings
- `POST /api/subscriptions/creator` - Set up creator subscription
- `GET /api/subscriptions/creator` - Get creator subscription details

### 4. UI Components

#### Creator Components
- `CreatorSubscriptionSetup` - Set up subscription offerings
- `SubscriptionInfo` - Display subscription information

#### Subscriber Components
- `SubscribeToCreator` - Subscribe to creators
- `SubscriptionTest` - Test subscription functionality

## Usage Examples

### 1. Setting Up Creator Subscription

```typescript
// Creator sets up subscription offering
const response = await fetch('/api/subscriptions/creator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creatorAddress: '0x...',
    monthlyFee: '5.00',
    description: 'Premium content and exclusive updates',
    benefits: ['Access to all premium content', 'Exclusive updates', 'Early access']
  }),
})
```

### 2. Creating Subscription-Only Content

```typescript
// Generate encryption key
const key = generateEncryptionKey()

// Encrypt content
const encryptedContent = await encryptContent(originalContent, key)

// Encrypt key for subscription access
const encryptedKeyMetadata = await encryptKeyForSubscriptionAccess(
  key, 
  contentId, 
  creatorAddress
)

// Store content with subscription access type
const metadata = {
  title: 'Premium Content',
  accessType: 'subscription',
  encryptedContent,
  encryptionKey: encryptedKeyMetadata,
  // ... other metadata
}
```

### 3. Checking Subscription Access

```typescript
// Check if user has active subscription
const response = await fetch('/api/subscriptions/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creatorAddress: '0x...',
    subscriberAddress: '0x...',
  }),
})

const { hasActiveSubscription, daysRemaining } = await response.json()

if (hasActiveSubscription) {
  // User can access subscription content
  const decryptedKey = await decryptKeyForSubscriptionAccess(
    encryptedKeyMetadata,
    creatorAddress,
    contentId
  )
  const decryptedContent = await decryptContent(encryptedContent, decryptedKey)
}
```

## Integration with Existing System

### 1. Content Access Types

The system now supports three access types:
- **`free`** - No payment required
- **`paid`** - Individual payment required per content
- **`subscription`** - Subscription required for access

### 2. Access Control Flow

```typescript
// Check access in order of priority
if (accessType === 'free') {
  // Always allow access
  return true
}

// Check individual payment first
const paymentStatus = await checkPayment(contentId, userAddress)
if (paymentStatus.hasPaid) {
  return true
}

// Check subscription access
const subscriptionStatus = await checkSubscription(creatorAddress, userAddress)
if (subscriptionStatus.hasActiveSubscription) {
  return true
}

// No access
return false
```

### 3. Decryption Methods

The system uses different decryption methods based on access type:
- **Individual payment**: `decryptKeyForPaidAccess()`
- **Subscription**: `decryptKeyForSubscriptionAccess()`

## Security Features

### 1. Multi-Layer Encryption
- Content encrypted with unique keys
- Keys encrypted for specific access methods
- Different encryption parameters for each creator

### 2. Access Control
- Creator address verification
- Content ID verification
- Subscription status verification
- Cryptographic signature verification

### 3. Payment Verification
- Transaction hash verification
- Subscription period validation
- Automatic expiration handling

## Testing

### Test Components
- `SubscriptionTest` - Comprehensive subscription system testing
- `SubscriptionInfo` - Display and manage subscriptions

### Test Scenarios
1. **Creator subscription setup**
2. **Subscriber subscription creation**
3. **Subscription status verification**
4. **Subscription-based encryption/decryption**
5. **Access control testing**
6. **Subscription cancellation**
7. **End-to-end workflow testing**

### Running Tests
1. Navigate to `/test-subscription`
2. Connect wallet
3. Run subscription tests
4. Verify all functionality works correctly

## Production Considerations

### 1. Payment Integration
- Replace test payment proofs with real payment system
- Implement subscription renewal automation
- Handle payment failures and retries

### 2. Key Management
- Use hardware security modules (HSM) for key storage
- Implement key rotation for long-term subscriptions
- Add key backup and recovery

### 3. Performance
- Cache subscription status for frequent checks
- Implement subscription status indexing
- Optimize database queries for subscription lookups

### 4. Monitoring
- Track subscription creation and cancellation rates
- Monitor subscription revenue and churn
- Alert on payment failures and subscription issues

## API Reference

### Subscription Endpoints

#### Create Subscription
```http
POST /api/subscriptions/create
Content-Type: application/json

{
  "creatorAddress": "0x...",
  "subscriberAddress": "0x...",
  "monthlyFee": "5.00",
  "txHash": "0x..."
}
```

#### Check Subscription
```http
POST /api/subscriptions/check
Content-Type: application/json

{
  "creatorAddress": "0x...",
  "subscriberAddress": "0x..."
}
```

#### Set Creator Subscription
```http
POST /api/subscriptions/creator
Content-Type: application/json

{
  "creatorAddress": "0x...",
  "monthlyFee": "5.00",
  "description": "Premium content access",
  "benefits": ["Access to all content", "Exclusive updates"]
}
```

### Response Formats

#### Subscription Status
```json
{
  "hasActiveSubscription": true,
  "subscription": {
    "id": "...",
    "monthlyFee": "5.00",
    "endDate": 1234567890,
    "status": "active"
  },
  "expiresAt": 1234567890,
  "daysRemaining": 25
}
```

#### Creator Subscription
```json
{
  "creatorAddress": "0x...",
  "monthlyFee": "5.00",
  "description": "Premium content access",
  "benefits": ["Access to all content", "Exclusive updates"],
  "isActive": true,
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

## Migration Guide

### From Individual Payments to Subscriptions

1. **Keep existing functionality**: Individual payments continue to work
2. **Add subscription option**: Creators can now offer subscriptions
3. **Gradual migration**: Creators can migrate content to subscription-only
4. **Hybrid approach**: Support both individual payments and subscriptions

### Content Migration

```typescript
// Old: Individual payment only
const metadata = {
  accessType: 'paid',
  tipAmount: '1.00',
  // ...
}

// New: Subscription support
const metadata = {
  accessType: 'subscription', // or 'paid' or 'free'
  tipAmount: '0', // Not used for subscription content
  // ...
}
```

## Future Enhancements

### 1. Advanced Features
- **Tiered subscriptions** with different price points
- **Subscription analytics** and insights
- **Automated renewal** with smart contracts
- **Subscription gifting** and sharing

### 2. Integration Features
- **Farcaster notifications** for subscription events
- **Social features** for subscribers
- **Creator-subscriber messaging**
- **Subscription communities**

### 3. Technical Improvements
- **Smart contract integration** for automated payments
- **Decentralized storage** for subscription data
- **Cross-chain support** for different payment tokens
- **Advanced analytics** and reporting 