import { NextRequest, NextResponse } from 'next/server'
import { getCreatorContent } from '@/lib/contentStorage'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    console.log('🔍 Fetching created content for user:', address)
    
    // Get content created by this user
    const userContent = getCreatorContent(address)
    
    console.log(`✅ Found ${userContent.length} content items for user`)
    
    return NextResponse.json({
      success: true,
      content: userContent,
      count: userContent.length
    })
    
  } catch (error) {
    console.error('❌ Error fetching user content:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch user content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 