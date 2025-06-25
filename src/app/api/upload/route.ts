import { NextRequest, NextResponse } from 'next/server'
import { uploadToIPFS } from '../../../lib/ipfs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to IPFS
    const result = await uploadToIPFS(file)

    return NextResponse.json({
      cid: result.cid,
      url: result.url
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    if (error instanceof Error) {
      // Check if it's a configuration error
      if (error.message.includes('IPFS configuration error')) {
        return NextResponse.json({ 
          error: 'IPFS configuration error. Please check your environment variables.',
          details: error.message 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: 'Unknown error' 
    }, { status: 500 })
  }
} 