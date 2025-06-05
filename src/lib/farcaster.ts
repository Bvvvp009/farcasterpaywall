import { sdk } from '@farcaster/frame-sdk'

export type FarcasterProfile = {
  fid?: number
  username?: string
  displayName?: string
  bio?: string
  avatar?: string
  followers?: number
  following?: number
  verifications?: string[]
  address: string
}

export async function getFarcasterProfileByAddress(address: string): Promise<FarcasterProfile | null> {
  try {
    // First check if we're in a Farcaster Mini App
    const isMiniApp = await sdk.isInMiniApp()
    
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address')
    }

    // For now, we'll return a basic profile with the address
    // In a production app, you would want to:
    // 1. Query the Farcaster API to get user data by address
    // 2. Cache the results
    // 3. Handle rate limiting and errors
    return {
      address,
      displayName: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
      // Other fields would be populated from the Farcaster API
    }
  } catch (error) {
    console.error('Error fetching Farcaster profile:', error)
    return null
  }
}

export function isValidEthereumAddress(address: string): boolean {
  // Check if the address is a valid Ethereum address
  return /^0x[a-fA-F0-9]{40}$/.test(address)
} 