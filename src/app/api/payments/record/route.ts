import { NextResponse } from 'next/server'
import { z } from 'zod'
import { kv } from '@vercel/kv'

// Schema for request validation
const recordPaymentSchema = z.object({
  contentId: z.string(),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  amount: z.string(),
  timestamp: z.number(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contentId, userAddress, txHash, amount, timestamp } = recordPaymentSchema.parse(body)

    // Record payment in KV store
    const paymentKey = `payment:${contentId}:${userAddress.toLowerCase()}`
    const paymentData = {
      txHash,
      amount,
      timestamp,
      contentId,
      userAddress: userAddress.toLowerCase(),
    }

    await kv.set(paymentKey, paymentData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording payment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 