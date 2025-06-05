import { NextRequest, NextResponse } from 'next/server'
import { testContentStore } from '@/lib/store'

// GET /api/content - Get all content for a user
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const creator = searchParams.get('creator')
  const cid = req.nextUrl.pathname.split('/').pop() // Get CID from path if it exists

  // If CID is provided, return specific content
  if (cid && cid !== 'content') {
    const key = `content_${cid}`
    const content = testContentStore.get(key)

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json(content)
  }

  // Otherwise, handle creator query
  if (!creator) {
    return NextResponse.json({ error: 'Creator address is required' }, { status: 400 })
  }

  // Get all content for the creator
  const content = Array.from(testContentStore.values())
    .filter(item => item.creator === creator)

  return NextResponse.json(content)
}

// POST /api/content - Create new content
export async function POST(req: NextRequest) {
  try {
    const content = await req.json()
    
    if (!content.creator || !content.contentCid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Store content in testContentStore
    const key = `content_${content.contentCid}`
    testContentStore.set(key, content)

    return NextResponse.json(content)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    )
  }
} 