import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSubscription } from '../../../../lib/subscription'

// Schema for subscription creation
const createSubscriptionSchema = z.object({
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  subscriberAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  monthlyFee: z.string(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { creatorAddress, subscriberAddress, monthlyFee, txHash } = createSubscriptionSchema.parse(body)

    const subscription = await createSubscription(
      creatorAddress,
      subscriberAddress,
      monthlyFee,
      txHash
    )

    return NextResponse.json({ 
      success: true, 
      subscription 
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 