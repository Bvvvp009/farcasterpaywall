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

    console.log('📝 API: Registering content:', { contentId, price, ipfsCid, userAddress })

    // Verify user signature if provided (for security)
    if (signature && message) {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature)
        if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          )
        }
        console.log('✅ User signature verified')
      } catch (error) {
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 401 }
        )
      }
    }

    // Use external RPC for reliable contract interactions
    const externalProvider = new ethers.JsonRpcProvider(externalRpcUrl)
    
    // For content registration, we need a signer with private key
    // This should be the content creator's private key (user's private key)
    const creatorPrivateKey = process.env.NEXT_PUBLIC_CREATOR_PRIVATE_KEY
    if (!creatorPrivateKey) {
      return NextResponse.json(
        { error: 'Creator private key not configured' },
        { status: 500 }
      )
    }

    const externalSigner = new ethers.Wallet(creatorPrivateKey, externalProvider)
    const contentContract = new ethers.Contract(contentAccessContract, contentAccessABI, externalSigner)

    // Convert contentId to bytes32
    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    // Convert price to USDC units (6 decimals)
    const priceInUSDC = ethers.parseUnits(price, 6)

    console.log('📋 Contract details:', {
      address: contentAccessContract,
      contentId: bytes32ContentId,
      price: priceInUSDC.toString(),
      ipfsCid: ipfsCid
    })

    // Register content on contract with proper gas estimation
    console.log('⏳ Submitting content registration transaction...')
    const tx = await contentContract.registerContent(
      bytes32ContentId,
      priceInUSDC,
      ipfsCid,
      { gasLimit: 300000 }
    )

    console.log('⏳ Transaction submitted:', tx.hash)
    console.log('⏳ Waiting for confirmation...')
    
    const receipt = await tx.wait()
    console.log('✅ Content registered successfully:', receipt.hash)

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      contentId: contentId,
      price: price,
      ipfsCid: ipfsCid,
      creator: userAddress
    })

  } catch (error) {
    console.error('❌ API: Content registration failed:', error)
    return NextResponse.json(
      { 
        error: 'Content registration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Content registration endpoint. Use POST to register content.' },
    { status: 200 }
  )
} 