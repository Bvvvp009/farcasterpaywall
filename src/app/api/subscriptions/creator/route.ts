import { NextResponse } from 'next/server'
import { z } from 'zod'
import { setCreatorSubscription, getCreatorSubscription } from '../../../../lib/subscription'

// Schema for creator subscription settings
const creatorSubscriptionSchema = z.object({
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  monthlyFee: z.string(),
  description: z.string(),
  benefits: z.array(z.string()),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { creatorAddress, monthlyFee, description, benefits } = creatorSubscriptionSchema.parse(body)

    const creatorSubscription = await setCreatorSubscription(
      creatorAddress,
      monthlyFee,
      description,
      benefits
    )

    return NextResponse.json({ 
      success: true, 
      creatorSubscription 
    })
  } catch (error) {
    console.error('Error setting creator subscription:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorAddress = searchParams.get('creatorAddress')

    if (!creatorAddress || !/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
      return NextResponse.json({ error: 'Invalid creator address' }, { status: 400 })
    }

    const creatorSubscription = await getCreatorSubscription(creatorAddress)

    if (!creatorSubscription) {
      return NextResponse.json({ error: 'Creator subscription not found' }, { status: 404 })
    }

    return NextResponse.json(creatorSubscription)
  } catch (error) {
    console.error('Error getting creator subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 