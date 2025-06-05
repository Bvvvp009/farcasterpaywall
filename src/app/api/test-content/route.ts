import { NextRequest, NextResponse } from 'next/server'
import { testContentStore } from '@/lib/store'

// GET /api/test-content - Get all test content
export async function GET(req: NextRequest) {
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
