import { NextResponse } from 'next/server'
import { testContentStore } from '../../../../lib/store'

export async function POST(request: Request) {
  try {
    const { contentId, creator, tipAmount, platformFee, creatorAmount } = await request.json()

    const content = testContentStore.get(contentId)
    if (!content) {
      return new NextResponse('Content not found', { status: 404 })
    }

    // Update revenue tracking
    content.revenue = {
      totalTips: (content.revenue?.totalTips || 0) + tipAmount,
      totalAmount: (content.revenue?.totalAmount || 0) + tipAmount,
      platformFees: (content.revenue?.platformFees || 0) + platformFee,
      netAmount: (content.revenue?.netAmount || 0) + creatorAmount
    }

    // Update the content in the store
    testContentStore.set(contentId, content)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating revenue:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 