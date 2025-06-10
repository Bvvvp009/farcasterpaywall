import { NextResponse } from 'next/server'
import { testContentStore } from '../../../../lib/store'

// Basic CID validation - checks if it's a valid IPFS CID format
function isValidCID(cid: string): boolean {
  // IPFS CIDs typically start with Qm (v0) or b (v1)
  // This is a basic check - in production you might want more sophisticated validation
  return /^Qm[a-zA-Z0-9]{44}$/.test(cid) || /^b[a-zA-Z0-9]{58}$/.test(cid)
}

export async function GET(
  request: Request,
  { params }: { params: { cid: string } }
) {
  try {
    // Validate CID format
    if (!isValidCID(params.cid)) {
      return NextResponse.json(
        { 
          error: 'Invalid CID format',
          cid: params.cid,
          validFormat: 'CID should start with Qm (v0) or b (v1) and be the correct length'
        }, 
        { status: 400 }
      )
    }

    // Use the correct key format that matches how content is stored
    const key = `content_${params.cid}`
    const content = testContentStore.get(key)
    
    // Add debug information
    const debugInfo = {
      requestedCid: params.cid,
      lookupKey: key,
      storeSize: testContentStore.size,
      availableKeys: Array.from(testContentStore.keys()).slice(0, 5), // Show first 5 keys for debugging
      contentFound: !!content
    }
    
    if (!content) {
      return NextResponse.json(
        { 
          error: 'Content not found',
          debug: debugInfo
        }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...content,
      debug: debugInfo
    })
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
} 