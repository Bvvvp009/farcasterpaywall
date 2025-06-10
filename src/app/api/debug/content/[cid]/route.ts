import { NextResponse } from 'next/server'
import { debugContent } from '../../../../../lib/debug'

export async function GET(
  request: Request,
  { params }: { params: { cid: string } }
) {
  try {
    const debugInfo = await debugContent(params.cid)
    
    return NextResponse.json({
      success: true,
      debug: debugInfo,
      recommendations: getRecommendations(debugInfo)
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

function getRecommendations(debugInfo: any): string[] {
  const recommendations = []
  
  if (!debugInfo.isValid) {
    recommendations.push('CID format is invalid. Check that it starts with Qm (v0) or b (v1) and has the correct length.')
  }
  
  if (!debugInfo.inStore) {
    recommendations.push('Content not found in local store. The content may not have been uploaded successfully.')
  }
  
  if (!debugInfo.ipfsAvailable) {
    recommendations.push('Content not available on IPFS. This could be due to: 1) Upload failure, 2) Propagation delay, 3) Gateway issues.')
  }
  
  if (debugInfo.storeSize === 0) {
    recommendations.push('Store is empty. No content has been uploaded yet.')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All checks passed. Content should be available.')
  }
  
  return recommendations
} 