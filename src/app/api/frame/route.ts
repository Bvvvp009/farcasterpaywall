import { NextRequest, NextResponse } from 'next/server'
import { getContent } from '@/lib/contentStorage'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cid, buttonIndex, fid } = body

    if (!cid) {
      return NextResponse.json({ error: 'Missing content ID' }, { status: 400 })
    }

    // Get content from our storage system
    const content = getContent(cid)
    
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // For paid content, we need to handle the payment flow
    if (content.accessType === 'paid') {
      // First button click - Show payment button
      if (buttonIndex === 1) {
        return NextResponse.json({
          success: true,
          frame: {
            version: "next",
            imageUrl: content.contentType === 'image' && content.ipfsCid
              ? `https://gateway.pinata.cloud/ipfs/${content.ipfsCid}`
              : `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}&price=${content.price}`,
            button: {
              title: `Pay ${content.price} USDC`,
              action: {
                type: "launch_frame",
                url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${cid}?action=pay`,
                name: content.title,
                splashImageUrl: content.contentType === 'image' && content.ipfsCid ? `https://gateway.pinata.cloud/ipfs/${content.ipfsCid}` : '/og-image.png',
                splashBackgroundColor: "#f5f0ec"
              }
            }
          }
        })
      }
    } else {
      // For free content, show the content directly
      return NextResponse.json({
        success: true,
        frame: {
          version: "next",
                      imageUrl: content.contentType === 'image' && content.ipfsCid
              ? `https://gateway.pinata.cloud/ipfs/${content.ipfsCid}`
              : `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}&price=${content.price}`,
            button: {
              title: "View Content",
              action: {
                type: "launch_frame",
                url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${cid}`,
                name: content.title,
                splashImageUrl: content.contentType === 'image' && content.ipfsCid ? `https://gateway.pinata.cloud/ipfs/${content.ipfsCid}` : '/og-image.png',
                splashBackgroundColor: "#f5f0ec"
              }
            }
        }
      })
    }

    // Default response for any other case
    return NextResponse.json({
      success: true,
      frame: {
        version: "next",
        imageUrl: content.contentType === 'image' && content.ipfsCid
          ? `https://gateway.pinata.cloud/ipfs/${content.ipfsCid}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}&price=${content.price}`,
        button: {
          title: content.accessType === 'paid' ? `Pay ${content.price} USDC` : 'View Content',
          action: {
            type: "launch_frame",
            url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${cid}${content.accessType === 'paid' ? '?action=pay' : ''}`,
            name: content.title,
            splashImageUrl: content.contentType === 'image' && content.ipfsCid ? `https://gateway.pinata.cloud/ipfs/${content.ipfsCid}` : '/og-image.png',
            splashBackgroundColor: "#f5f0ec"
          }
        }
      }
    })
  } catch (error) {
    console.error('Frame API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 