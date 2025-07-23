import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

// External RPC for reliable contract interactions
const externalRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"

// USDC Token Address
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

// USDC Token ABI (for transfer event parsing)
const usdcABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address account) view returns (uint256)"
]

export async function POST(request: NextRequest) {
  try {
    const { txHash, expectedToAddress, expectedAmount, userAddress } = await request.json()

    // Validate required fields
    if (!txHash || !expectedToAddress || !expectedAmount || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: txHash, expectedToAddress, expectedAmount, userAddress' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Verifying payment:', { txHash, expectedToAddress, expectedAmount, userAddress })

    // Use external RPC for transaction verification
    const externalProvider = new ethers.JsonRpcProvider(externalRpcUrl)
    
    // Get transaction details
    const tx = await externalProvider.getTransaction(txHash)
    const receipt = await externalProvider.getTransactionReceipt(txHash)
    
    if (!tx || !receipt || receipt.status !== 1) {
      return NextResponse.json(
        { error: 'Transaction failed or not found' },
        { status: 400 }
      )
    }

    console.log('✅ Transaction found and successful')

    // Verify it's a USDC transfer
    if (tx.to?.toLowerCase() !== usdcTokenAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Not a USDC transfer' },
        { status: 400 }
      )
    }

    console.log('✅ Transaction is a USDC transfer')

    // Parse USDC transfer events
    const usdcContract = new ethers.Contract(usdcTokenAddress, usdcABI, externalProvider)
    
    // Get transfer events from the transaction
    const transferEvents = receipt.logs
      .filter((log: any) => log.address.toLowerCase() === usdcTokenAddress.toLowerCase())
      .map((log: any) => {
        try {
          return usdcContract.interface.parseLog(log)
        } catch {
          return null
        }
      })
      .filter(Boolean)

    console.log('📊 Found transfer events:', transferEvents.length)

    // Look for the specific transfer to the expected address
    const expectedTransfer = transferEvents.find((event: any) => {
      return event?.name === 'Transfer' && 
             event?.args?.to?.toLowerCase() === expectedToAddress.toLowerCase() &&
             event?.args?.from?.toLowerCase() === userAddress.toLowerCase()
    })

    if (!expectedTransfer) {
      return NextResponse.json(
        { error: 'Expected USDC transfer not found in transaction' },
        { status: 400 }
      )
    }

    // Verify amount (convert to USDC units for comparison)
    const expectedAmountInWei = ethers.parseUnits(expectedAmount, 6)
    const actualAmount = expectedTransfer.args.value

    if (actualAmount !== expectedAmountInWei) {
      return NextResponse.json(
        { 
          error: 'Amount mismatch',
          expected: expectedAmountInWei.toString(),
          actual: actualAmount.toString()
        },
        { status: 400 }
      )
    }

    console.log('✅ Payment verified successfully')

    return NextResponse.json({
      success: true,
      verified: true,
      txHash: txHash,
      from: userAddress,
      to: expectedToAddress,
      amount: expectedAmount,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString()
    })

  } catch (error) {
    console.error('❌ API: Payment verification failed:', error)
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Payment verification endpoint. Use POST to verify payments.' },
    { status: 200 }
  )
} 