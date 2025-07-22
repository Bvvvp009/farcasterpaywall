import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title') || 'Content Preview'
    const description = searchParams.get('description') || ''

    // For Next.js 13.5.6, we'll return a simple JSON response instead of an image
    // This can be updated later when deploying to a platform that supports newer Next.js versions
    return new Response(
      JSON.stringify({
        title,
        description,
        type: 'website',
        image: '/api/og-image', // Fallback to a static image
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (e) {
    console.error('Error generating OG data:', e)
    return new Response('Failed to generate OG data', { status: 500 })
  }
} 