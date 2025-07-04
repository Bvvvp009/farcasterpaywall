import { NextResponse } from 'next/server'
import { z } from 'zod'
import { kv } from '@vercel/kv'

// Schema for request validation
const checkPaymentSchema = z.object({
  contentId: z.string(),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

// Type for payment data
interface PaymentData {
  txHash: string
  amount: string
  timestamp: number
  contentId: string
  userAddress: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contentId, userAddress } = checkPaymentSchema.parse(body)

    // Check if payment exists in KV store
    const paymentKey = `payment:${contentId}:${userAddress.toLowerCase()}`
    const paymentData = await kv.get<PaymentData>(paymentKey)

    if (paymentData) {
      return NextResponse.json({ 
        hasPaid: true, 
        amount: paymentData.amount,
        timestamp: paymentData.timestamp,
        txHash: paymentData.txHash
      })
    } else {
      return NextResponse.json({ hasPaid: false })
    }
  } catch (error) {
    console.error('Error checking payment status:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 