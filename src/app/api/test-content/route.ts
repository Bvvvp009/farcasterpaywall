import { NextRequest, NextResponse } from 'next/server'
import { testContentStore } from '@/lib/store'

// GET /api/test-content - Get all test content
export async function GET(req: NextRequest) {
  // Create a test content item if none exists
  if (testContentStore.size === 0) {
    const testContent = {
      title: "Test Premium Article",
      description: "This is a test article that requires payment to view. It demonstrates the frame functionality with paid content.",
      contentType: "article",
      accessType: "paid",
      contentCid: "test-article-1",
      contentUrl: "https://example.com/test-article",
      creator: "0x0000000000000000000000000000000000000000",
      tipAmount: "1.00",
      createdAt: new Date().toISOString(),
      revenue: {
        totalTips: 0,
        totalAmount: 0,
        platformFees: 0,
        netAmount: 0
      }
    }

    // Store in memory
    const key = `content_${testContent.contentCid}`
    testContentStore.set(key, testContent)
  }

  // Return all test content
  const content = Array.from(testContentStore.values())
  return NextResponse.json(content)
}

// POST /api/test-content - Add test content
export async function POST(req: NextRequest) {
  try {
    const content = await req.json()
    const key = `content_${content.contentCid}`
    testContentStore.set(key, content)
    return NextResponse.json(content)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add test content' },
      { status: 500 }
    )
  }
}
export { testContentStore }

