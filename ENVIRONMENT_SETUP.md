# Environment Setup Guide

## Required Environment Variables

### Mainnet Configuration
```env
# Base Network RPC URL
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# Contract Addresses (Base Mainnet)
NEXT_PUBLIC_BASE_LIT_CONTRACT=0xYourDeployedContractAddress
NEXT_PUBLIC_USDC_CONTRACT_BASE=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Creator Private Key (for content creation)
NEXT_PUBLIC_PRIVATE_KEY=0xYourCreatorPrivateKey
```

### Testing Configuration (Base Sepolia)
```env
# Base Sepolia Network
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Base Sepolia Contracts
NEXT_PUBLIC_BASE_SEPOLIA_LIT_CONTRACT=0x7A4B6A7d445C2E4B2532beE12E540896f4cD2357
NEXT_PUBLIC_USDC_CONTRACT_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Test Wallets
NEXT_PUBLIC_PRIVATE_KEY=0xYourCreatorPrivateKey
NEXT_PUBLIC_SECONDARY_PRIVATE_KEY=0xYourTestUserPrivateKey
```

### IPFS Configuration
```env
# Pinata API Keys (for IPFS uploads)
NEXT_PUBLIC_PINATA_API_KEY=YourPinataAPIKey
NEXT_PUBLIC_PINATA_API_SECRET=YourPinataSecretKey
```

## Setup Instructions

### 1. Mainnet Deployment
1. Deploy the ContentAccess contract to Base Mainnet
2. Update `NEXT_PUBLIC_BASE_LIT_CONTRACT` with your deployed contract address
3. Set `NEXT_PUBLIC_BASE_RPC_URL` to Base mainnet RPC
4. Configure your creator wallet private key

### 2. Testing Setup (Base Sepolia)
1. Set `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` to Base Sepolia RPC
2. Configure `NEXT_PUBLIC_BASE_SEPOLIA_LIT_CONTRACT` with deployed contract
3. Set both private keys for creator and user testing
4. Use the `/lit` route for testing with real contract interactions
5. Creator wallet registers content, user wallet pays and decrypts

### 3. IPFS Setup
1. Create a Pinata account
2. Get your API keys
3. Configure IPFS uploads for content storage

## Usage

### Mainnet (Production)
- **Homepage** (`/`) - User content discovery
- **Create Content** (`/create`) - Farcaster Mini App only
- **Profile** (`/profile`) - User content management
- **Content View** (`/content/[cid]`) - Content display and payment

### Testing (Development)
- **Test Environment** (`/lit`) - Full testing with Base Sepolia contract
- Creator wallet: Registers content on blockchain
- User wallet: Pays for content and decrypts
- Real contract interactions on Base Sepolia testnet

## Security Notes

⚠️ **Important Security Considerations:**
- Never commit private keys to version control
- Use environment variables for all sensitive data
- Test thoroughly on testnet before mainnet deployment
- Keep private keys secure and separate from codebase

## Farcaster Mini App Integration

The app is designed to work within the Farcaster Mini App environment:
- Content creation requires Farcaster Mini App
- Wallet integration via Farcaster SDK
- User authentication through Farcaster
- Seamless payment experience

## Testing Workflow

1. **Setup Environment Variables** (Base Sepolia)
2. **Test with `/lit` route** using real contract interactions
3. **Verify Contract Integration** on Base Sepolia testnet
4. **Deploy Contract** to Base Mainnet when ready
5. **Verify Mainnet Integration** with real Farcaster Mini App
6. **Deploy to Production** when testing is complete 