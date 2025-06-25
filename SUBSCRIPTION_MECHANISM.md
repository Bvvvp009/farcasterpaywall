# Subscription Mechanism Documentation

## Overview

The subscription system allows creators to offer monthly USDC subscriptions to their followers, granting subscribers access to all premium content. This document explains the complete mechanism, endpoints, and user flows.

## 🔄 Subscription Flow

### **Creator Side (Setting Up Subscriptions)**
1. Creator visits `/subscription-setup`
2. Sets monthly subscription fee (USDC)
3. Configures subscription details
4. System creates subscription offering

### **User Side (Subscribing)**
1. User discovers creator's subscription offering
2. Clicks "Subscribe" button
3. Farcaster Mini App prompts for USDC payment
4. Payment processed via `sdk.actions.sendToken()`
5. Subscription recorded and access granted

## 📡 API Endpoints

### **1. Creator Subscription Setup**
```
POST /api/subscriptions/creator
```

**Purpose**: Set up or update creator's subscription offering

**Request Body**:
```json
{
  "creatorFid": 12345,
  "monthlyFee": "5.00",
  "description": "Access to all premium content",
  "benefits": ["Exclusive posts", "Early access", "Direct messages"]
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "creatorFid": 12345,
    "monthlyFee": "5.00",
    "description": "Access to all premium content",
    "benefits": ["Exclusive posts", "Early access", "Direct messages"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### **2. Create Subscription**
```
POST /api/subscriptions/create
```

**Purpose**: Create a new subscription for a user

**Request Body**:
```json
{
  "subscriberFid": 67890,
  "creatorFid": 12345,
  "monthlyFee": "5.00",
  "txHash": "0x1234567890abcdef..."
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "subscriberFid": 67890,
    "creatorFid": 12345,
    "monthlyFee": "5.00",
    "startDate": "2024-01-15T10:30:00Z",
    "endDate": "2024-02-15T10:30:00Z",
    "status": "active",
    "txHash": "0x1234567890abcdef..."
  }
}
```

### **3. Check Subscription Status**
```
POST /api/subscriptions/check
```

**Purpose**: Check if a user has an active subscription to a creator

**Request Body**:
```json
{
  "subscriberFid": 67890,
  "creatorFid": 12345
}
```

**Response**:
```json
{
  "hasSubscription": true,
  "subscription": {
    "id": "sub_123",
    "monthlyFee": "5.00",
    "startDate": "2024-01-15T10:30:00Z",
    "endDate": "2024-02-15T10:30:00Z",
    "status": "active"
  }
}
```

### **4. Renew Subscription**
```
POST /api/subscriptions/renew
```

**Purpose**: Renew an existing subscription

**Request Body**:
```json
{
  "subscriptionId": "sub_123",
  "txHash": "0xabcdef1234567890..."
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "endDate": "2024-03-15T10:30:00Z",
    "status": "active"
  }
}
```

### **5. Cancel Subscription**
```
POST /api/subscriptions/cancel
```

**Purpose**: Cancel an active subscription

**Request Body**:
```json
{
  "subscriptionId": "sub_123"
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "status": "cancelled",
    "cancelledAt": "2024-01-20T15:45:00Z"
  }
}
```

## 🎯 How Users Subscribe

### **Step 1: Discover Subscription**
Users can discover creator subscriptions through:
- Creator's profile page
- Content pages showing subscription-only content
- Direct links shared by creators

### **Step 2: Subscribe Button**
```typescript
// In SubscribeToCreator component
const handleSubscribe = async () => {
  try {
    // Use Farcaster's native payment
    const result = await sdk.actions.sendToken({
      token: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      amount: (parseFloat(monthlyFee) * 1_000_000).toString(),
      recipientFid: creatorFid // Send to creator's FID
    })

    if (result.success) {
      // Record subscription
      await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberFid: userFid,
          creatorFid: creatorFid,
          monthlyFee: monthlyFee,
          txHash: result.send.transaction
        })
      })
    }
  } catch (error) {
    console.error('Subscription failed:', error)
  }
}
```

### **Step 3: Access Granted**
Once subscribed, users get access to:
- All premium content from the creator
- Subscription-only posts
- Exclusive features

## 🔐 Content Access Mechanism

### **Individual Post Payments vs Subscriptions**

```typescript
// In ContentView component
const checkAccess = async () => {
  // Method 1: Check individual payment
  const individualPayment = await checkIndividualPayment(contentId, userAddress)
  
  // Method 2: Check subscription
  const subscription = await checkSubscription(userFid, creatorFid)
  
  // Grant access if either condition is met
  if (individualPayment || subscription) {
    setHasAccess(true)
    await decryptContent()
  }
}
```

### **Subscription-Based Encryption**
```typescript
// Encrypt content for subscription access
const encryptedKey = await encryptKeyForSubscription(
  contentKey,
  creatorFid,
  monthlyFee
)

// Decrypt content for subscribers
const decryptedKey = await decryptKeyForSubscription(
  encryptedKey,
  userFid,
  creatorFid
)
```

## 💰 Payment Processing

### **Farcaster Native Payments**
```typescript
// Uses Farcaster's built-in payment system
const result = await sdk.actions.sendToken({
  token: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
  amount: (parseFloat(amount) * 1_000_000).toString(), // Convert to USDC units
  recipientFid: creatorFid // Send to creator's FID
})
```

### **Payment Verification**
```typescript
// Verify payment on-chain
const verification = await verifyOnChainPayment(
  txHash,
  creatorAddress,
  monthlyFee
)
```

## 📊 Subscription Management

### **Creator Dashboard**
Creators can:
- Set subscription price
- View subscriber count
- Track subscription revenue
- Manage subscription benefits

### **User Dashboard**
Users can:
- View active subscriptions
- Cancel subscriptions
- See subscription history
- Access subscribed content

## 🔄 Subscription Lifecycle

### **1. Active Subscription**
- User has paid and subscription is valid
- Access to all premium content
- Automatic renewal reminders

### **2. Expired Subscription**
- Subscription period has ended
- No access to premium content
- Option to renew

### **3. Cancelled Subscription**
- User cancelled before expiration
- Access until end of paid period
- No automatic renewal

## 🛡️ Security Features

### **Payment Verification**
- All payments verified on-chain
- Transaction hash validation
- Amount verification

### **Access Control**
- Subscription status checked for each content access
- Encrypted content keys for subscription access
- FID-based user identification

### **Fraud Prevention**
- Duplicate payment detection
- Subscription period validation
- Creator verification

## 📱 User Experience

### **Subscription Discovery**
- Clear subscription buttons on creator profiles
- Subscription-only content indicators
- Pricing transparency

### **Payment Flow**
- Seamless Farcaster Mini App integration
- Clear payment confirmation
- Immediate access after payment

### **Content Access**
- Automatic access to premium content
- Clear subscription status indicators
- Easy content discovery

## 🔗 Integration Points

### **With Existing System**
- Works alongside individual post payments
- Same encryption/decryption system
- Compatible with existing content structure

### **With Farcaster**
- Uses native Farcaster payment system
- Integrates with Farcaster user context
- Leverages FID for user identification

## 📈 Analytics & Insights

### **Creator Analytics**
- Subscriber growth over time
- Revenue tracking
- Content performance with subscribers

### **User Analytics**
- Subscription spending
- Content consumption patterns
- Subscription renewal rates

## 🚀 Future Enhancements

### **Smart Contracts**
- Automated recurring payments
- Subscription NFTs
- Revenue sharing contracts

### **Advanced Features**
- Tiered subscriptions
- Group subscriptions
- Subscription gifting

### **Social Features**
- Subscription sharing
- Creator recommendations
- Community features

This subscription mechanism provides a complete solution for creators to monetize their content through recurring subscriptions while leveraging Farcaster's native payment capabilities. 