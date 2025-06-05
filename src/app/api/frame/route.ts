import { NextRequest, NextResponse } from 'next/server'
import { testContentStore } from '../test-content/route'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cid, buttonIndex, fid } = body

    if (!cid) {
      return NextResponse.json({ error: 'Missing content ID' }, { status: 400 })
    }

    // Get content from our API
    const key = `content_${cid}`
    const content = testContentStore.get(key)
    
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
            imageUrl: content.contentType === 'image' 
              ? content.contentUrl 
              : `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}&type=${content.contentType}`,
            button: {
              title: `Pay ${content.tipAmount} USDC`,
              action: {
                type: "launch_frame",
                url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${cid}?action=pay`,
                name: content.title,
                splashImageUrl: content.contentType === 'image' ? content.contentUrl : '/og-image.png',
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
          imageUrl: content.contentType === 'image' 
            ? content.contentUrl 
            : `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}&type=${content.contentType}`,
          button: {
            title: "View Content",
            action: {
              type: "launch_frame",
              url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${cid}`,
              name: content.title,
              splashImageUrl: content.contentType === 'image' ? content.contentUrl : '/og-image.png',
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
        imageUrl: content.contentType === 'image' 
          ? content.contentUrl 
          : `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}&type=${content.contentType}`,
        button: {
          title: content.accessType === 'paid' ? `Pay ${content.tipAmount} USDC` : 'View Content',
          action: {
            type: "launch_frame",
            url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${cid}${content.accessType === 'paid' ? '?action=pay' : ''}`,
            name: content.title,
            splashImageUrl: content.contentType === 'image' ? content.contentUrl : '/og-image.png',
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