import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cancelSubscription } from '../../../../lib/subscription'

// Schema for subscription cancellation
const cancelSubscriptionSchema = z.object({
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  subscriberAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { creatorAddress, subscriberAddress } = cancelSubscriptionSchema.parse(body)

    await cancelSubscription(creatorAddress, subscriberAddress)

    return NextResponse.json({ 
      success: true 
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'No subscription found') {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 