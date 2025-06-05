import { NextResponse } from 'next/server'

// Simple in-memory storage for test content
const testContentStore = new Map<string, any>()

export async function GET() {
  // Create a test content item
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

  // Store in memory (in a real app, this would be in a database)
  const key = `content_${testContent.contentCid}`
  testContentStore.set(key, testContent)

  // Return the content ID for testing
  return NextResponse.json({ 
    contentId: testContent.contentCid,
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/content/${testContent.contentCid}`
  })
}

// Export the store so it can be accessed by other API routes
export { testContentStore } 