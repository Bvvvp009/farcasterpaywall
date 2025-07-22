// Comprehensive Farcaster Mini App Actions Library
// Based on latest SDK documentation: https://miniapps.farcaster.xyz/docs/sdk

import { ethers } from 'ethers'

export interface CastResult {
  hash?: string
  channelKey?: string
}

// SDK Response Types (matching Farcaster SDK)
export interface SendTokenDetails {
  transaction: `0x${string}`
}

export interface SendTokenErrorDetails {
  error: string
  message?: string
}

export type SendTokenErrorReason = 'rejected_by_user' | 'send_failed'

export type SendTokenResult = {
  success: true
  send: SendTokenDetails
} | {
  success: false
  reason: SendTokenErrorReason
  error?: SendTokenErrorDetails
}

export interface SwapTokenDetails {
  transactions: `0x${string}`[]
}

export interface SwapTokenErrorDetails {
  error: string
  message?: string
}

export type SwapErrorReason = 'rejected_by_user' | 'swap_failed'

export type SwapTokenResult = {
  success: true
  swap: SwapTokenDetails
} | {
  success: false
  reason: SwapErrorReason
  error?: SwapTokenErrorDetails
}

export interface QuickAuthResult {
  success: boolean
  token?: string
  error?: string
}

/**
 * View a specific cast in the Farcaster client
 */
export async function viewCast(castHash: string, closeApp: boolean = false): Promise<void> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    console.log('👀 Viewing cast:', castHash)
    await sdk.actions.viewCast({ 
      hash: castHash,
      close: closeApp
    })
    console.log('✅ Cast view opened')
  } catch (error) {
    console.error('❌ Error viewing cast:', error)
    throw error
  }
}

/**
 * View a user's Farcaster profile
 */
export async function viewProfile(fid: number): Promise<void> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    console.log('👤 Viewing profile for FID:', fid)
    await sdk.actions.viewProfile({ fid })
    console.log('✅ Profile view opened')
  } catch (error) {
    console.error('❌ Error viewing profile:', error)
    throw error
  }
}

/**
 * Open external URL (useful for deeplinks)
 */
export async function openUrl(url: string): Promise<void> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      // Fallback for non-Mini App environments
      window.open(url, '_blank')
      return
    }

    console.log('🔗 Opening URL:', url)
    await sdk.actions.openUrl(url)
    console.log('✅ URL opened')
  } catch (error) {
    console.error('❌ Error opening URL:', error)
    // Fallback to window.open
    window.open(url, '_blank')
  }
}

/**
 * Close the Mini App
 */
export async function closeApp(): Promise<void> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      console.log('⚠️ Not in Mini App environment, cannot close')
      return
    }

    console.log('🚪 Closing Mini App')
    await sdk.actions.close()
  } catch (error) {
    console.error('❌ Error closing app:', error)
  }
}

/**
 * Enhanced cast composition with all available options
 */
export async function composeCast(options: {
  text?: string
  embeds?: string[]
  parentHash?: string
  closeAfterCast?: boolean
  channelKey?: string
}): Promise<CastResult | null> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    const castParams: any = {}
    
    if (options.text) castParams.text = options.text
    if (options.embeds) castParams.embeds = options.embeds
    if (options.closeAfterCast) castParams.close = options.closeAfterCast
    if (options.channelKey) castParams.channelKey = options.channelKey
    
    if (options.parentHash) {
      castParams.parent = {
        type: 'cast',
        hash: options.parentHash
      }
    }

    console.log('📢 Composing cast with params:', castParams)
    const result = await sdk.actions.composeCast(castParams)
    
    if (result?.cast) {
      console.log('✅ Cast composed successfully:', result.cast.hash)
      return {
        hash: result.cast.hash,
        channelKey: result.cast.channelKey
      }
    } else {
      console.log('⚠️ Cast composition cancelled by user')
      return null
    }
  } catch (error) {
    console.error('❌ Error composing cast:', error)
    throw error
  }
}

/**
 * Enhanced token sending with better error handling
 */
export async function sendToken(options: {
  token: string
  amount: string
  recipientAddress?: string
  recipientFid?: number
}): Promise<SendTokenResult> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    const sendParams: any = {
      token: options.token,
      amount: options.amount
    }

    if (options.recipientFid) {
      sendParams.recipientFid = options.recipientFid
    } else if (options.recipientAddress) {
      sendParams.recipientAddress = options.recipientAddress
    } else {
      throw new Error("Either recipientAddress or recipientFid must be provided")
    }

    console.log('💸 Sending token with params:', sendParams)
    const result = await sdk.actions.sendToken(sendParams)

    if (result.success) {
      console.log('✅ Token sent successfully:', result.send.transaction)
      return {
        success: true,
        send: { transaction: result.send.transaction }
      }
    } else {
      console.log('❌ Token send failed:', result.reason)
      return {
        success: false,
        reason: result.reason,
        error: result.error || { error: 'Send failed' }
      }
    }
  } catch (error) {
    console.error('❌ Error sending token:', error)
    return {
      success: false,
      reason: 'send_failed',
      error: { error: error instanceof Error ? error.message : 'Send failed' }
    }
  }
}

/**
 * Swap tokens using Farcaster's native swap interface
 */
export async function swapToken(options: {
  sellToken: string
  buyToken: string
  sellAmount: string
}): Promise<SwapTokenResult> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    console.log('🔄 Swapping tokens:', options)
    const result = await sdk.actions.swapToken({
      sellToken: options.sellToken,
      buyToken: options.buyToken,
      sellAmount: options.sellAmount
    })

    if (result.success) {
      console.log('✅ Token swap successful:', result.swap.transactions)
      return {
        success: true,
        swap: { transactions: result.swap.transactions }
      }
    } else {
      console.log('❌ Token swap failed:', result.reason)
      return {
        success: false,
        reason: result.reason,
        error: result.error || { error: 'Swap failed' }
      }
    }
  } catch (error) {
    console.error('❌ Error swapping tokens:', error)
    return {
      success: false,
      reason: 'swap_failed',
      error: { error: error instanceof Error ? error.message : 'Swap failed' }
    }
  }
}

/**
 * Get Quick Auth JWT (experimental feature)
 */
export async function getQuickAuthJWT(): Promise<QuickAuthResult> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    console.log('🔐 Requesting Quick Auth JWT...')
    const { token } = await sdk.experimental.quickAuth()
    
    console.log('✅ Quick Auth JWT received')
    return {
      success: true,
      token: token
    }
  } catch (error) {
    console.error('❌ Error getting Quick Auth JWT:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Quick Auth failed'
    }
  }
}

/**
 * Add Mini App to user's collection
 */
export async function addMiniApp(): Promise<void> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    console.log('➕ Adding Mini App to collection...')
    await sdk.actions.addMiniApp()
    console.log('✅ Mini App added to collection')
  } catch (error) {
    console.error('❌ Error adding Mini App:', error)
    throw error
  }
}

/**
 * Utility function to get all available actions
 */
export function getAvailableActions(): string[] {
  return [
    'viewCast',
    'viewProfile', 
    'openUrl',
    'closeApp',
    'composeCast',
    'sendToken',
    'swapToken',
    'getQuickAuthJWT',
    'addMiniApp'
  ]
}

/**
 * Check if specific action is available in current environment
 */
export async function isActionAvailable(action: string): Promise<boolean> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    const isMiniApp = await sdk.isInMiniApp()
    
    if (!isMiniApp) {
      return false
    }

    // Check if action exists in SDK
    const availableActions = getAvailableActions()
    return availableActions.includes(action)
  } catch (error) {
    console.error('❌ Error checking action availability:', error)
    return false
  }
} 