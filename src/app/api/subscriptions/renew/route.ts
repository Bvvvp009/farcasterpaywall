import { NextResponse } from 'next/server'
import { z } from 'zod'
import { renewSubscription } from '../../../../lib/subscription'

// Schema for subscription renewal
const renewSubscriptionSchema = z.object({
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  subscriberAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { creatorAddress, subscriberAddress, txHash } = renewSubscriptionSchema.parse(body)

    const subscription = await renewSubscription(
      creatorAddress,
      subscriberAddress,
      txHash
    )

    return NextResponse.json({ 
      success: true, 
      subscription 
    })
  } catch (error) {
    console.error('Error renewing subscription:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'No existing subscription found') {
      return NextResponse.json({ error: 'No existing subscription found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 