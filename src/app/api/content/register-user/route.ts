import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

// Contract addresses
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29"

// External RPC for reliable contract interactions
const externalRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"

// ContentAccess Contract ABI
const contentAccessABI = [
  "function registerContent(bytes32 contentId, uint256 price, string ipfsCid)",
  "function checkAccess(address user, bytes32 contentId) view returns (bool)",
  "function getContent(bytes32 contentId) view returns (tuple(address creator, uint256 price, string ipfsCid, bool isActive, uint256 createdAt))"
]

export async function POST(request: NextRequest) {
  try {
    const { contentId, price, ipfsCid, userAddress, signature, message } = await request.json()

    // Validate required fields
    if (!contentId || !price || !ipfsCid || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, price, ipfsCid, userAddress' },
        { status: 400 }
      )
    }

    console.log('📝 API: User-based content registration:', { contentId, price, ipfsCid, userAddress })

    // Verify user signature (required for security)
    if (!signature || !message) {
      return NextResponse.json(
        { error: 'User signature required for content registration' },
        { status: 401 }
      )
    }

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature)
      if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'Invalid signature - address mismatch' },
          { status: 401 }
        )
      }
      console.log('✅ User signature verified:', recoveredAddress)
    } catch (error) {
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      )
    }

    // For user-based registration, we need the user's private key
    // This should be provided securely by the user or through a secure method
    // For now, we'll return instructions on how to handle this securely
    
    return NextResponse.json({
      success: true,
      message: 'User signature verified. Content registration requires user wallet interaction.',
      instructions: [
        '1. User should sign the content registration transaction with their wallet',
        '2. Use the Farcaster wallet for transaction signing',
        '3. Verify the transaction on-chain',
        '4. Store the transaction hash for reference'
      ],
      contentDetails: {
        contentId,
        price,
        ipfsCid,
        userAddress,
        contractAddress: contentAccessContract
      }
    })

  } catch (error) {
    console.error('❌ API: User-based content registration failed:', error)
    return NextResponse.json(
      { 
        error: 'User-based content registration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'User-based content registration endpoint. Use POST to register content.',
      note: 'This endpoint requires user signature verification for security.'
    },
    { status: 200 }
  )
} 