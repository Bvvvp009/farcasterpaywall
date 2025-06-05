import { NextRequest, NextResponse } from 'next/server'
import { testContentStore } from '../test-content/route'

// GET /api/content - Get all content for a user
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const creator = searchParams.get('creator')

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

// GET /api/content/:cid - Get specific content by CID
export async function GET_CID(req: NextRequest, { params }: { params: { cid: string } }) {
  const { cid } = params
  const key = `content_${cid}`
  const content = testContentStore.get(key)

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  return NextResponse.json(content)
} 