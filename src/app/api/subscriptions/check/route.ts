import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkSubscription } from '../../../../lib/subscription'

// Schema for subscription check
const checkSubscriptionSchema = z.object({
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  subscriberAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { creatorAddress, subscriberAddress } = checkSubscriptionSchema.parse(body)

    const verification = await checkSubscription(creatorAddress, subscriberAddress)

    return NextResponse.json(verification)
  } catch (error) {
    console.error('Error checking subscription:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 