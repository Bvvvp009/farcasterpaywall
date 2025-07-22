import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title') || 'Content Preview'
    const description = searchParams.get('description') || ''

    const imageElement = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '40px',
          background: 'linear-gradient(to bottom right, #f5f0ec, #fff)',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            marginBottom: '24px',
          }}
        >
          🔐
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: '24px',
              color: '#4a4a4a',
              textAlign: 'center',
            }}
          >
            {description}
          </div>
        )}
        <div
          style={{
            fontSize: '18px',
            color: '#666',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          Farcaster Paywall
        </div>
      </div>
    )

    return new ImageResponse(imageElement, {
      width: 1200,
      height: 630,
    })
  } catch (e) {
    console.error('Error generating OG image:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
} 