import { NextResponse } from 'next/server'
import { testContentStore } from '../../../../lib/store'

export async function GET(
  request: Request,
  { params }: { params: { cid: string } }
) {
  try {
    const content = testContentStore.get(params.cid)
    if (!content) {
      return new NextResponse('Content not found', { status: 404 })
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching content:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 