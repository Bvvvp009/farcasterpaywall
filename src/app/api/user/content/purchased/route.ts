import { NextRequest, NextResponse } from 'next/server'
import { getAllContent } from '@/lib/contentStorage'
import { checkContentAccess } from '@/lib/hybridWalletSystem'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    console.log('🔍 Fetching purchased content for user:', address)
    
    // Get all content and check which ones the user has access to
    const allContent = getAllContent()
    const purchasedContent = []
    
    for (const content of allContent) {
      try {
        const hasAccess = await checkContentAccess(content.contentId, address)
        if (hasAccess && content.creator.toLowerCase() !== address.toLowerCase()) {
          purchasedContent.push(content)
        }
      } catch (error) {
        console.warn(`⚠️ Error checking access for content ${content.contentId}:`, error)
      }
    }
    
    console.log(`✅ Found ${purchasedContent.length} purchased content items for user`)
    
    return NextResponse.json({
      success: true,
      content: purchasedContent,
      count: purchasedContent.length
    })
    
  } catch (error) {
    console.error('❌ Error fetching purchased content:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch purchased content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 