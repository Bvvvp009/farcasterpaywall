import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'default'
    const title = searchParams.get('title') || 'Content Preview'
    const description = searchParams.get('description') || ''
    const url = searchParams.get('url')
    const text = searchParams.get('text')
    const overlay = searchParams.get('overlay') === 'true'

    // Load fonts
    const interBold = fetch(
      new URL('https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap')
    ).then((res) => res.arrayBuffer())

    const interRegular = fetch(
      new URL('https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap')
    ).then((res) => res.arrayBuffer())

    // Load logo
    const logo = fetch(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`))
      .then((res) => res.arrayBuffer())
      .then((buffer) => `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`)

    // Load play button icon for videos
    const playIcon = fetch(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/play-icon.png`))
      .then((res) => res.arrayBuffer())
      .then((buffer) => `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`)

    const [interBoldData, interRegularData, logoData, playIconData] = await Promise.all([
      interBold,
      interRegular,
      logo,
      playIcon,
    ])

    // Create base image based on content type
    let imageElement: JSX.Element

    switch (type) {
      case 'image':
        if (!url) throw new Error('URL is required for image type')
        imageElement = (
          <div
            style={{
              display: 'flex',
              position: 'relative',
              width: '100%',
              height: '100%',
            }}
          >
            <img
              src={url}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {overlay && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={logoData}
                  alt="Logo"
                  style={{
                    width: '120px',
                    height: '120px',
                    opacity: 0.8,
                  }}
                />
              </div>
            )}
          </div>
        )
        break

      case 'video':
        if (!url) throw new Error('URL is required for video type')
        imageElement = (
          <div
            style={{
              display: 'flex',
              position: 'relative',
              width: '100%',
              height: '100%',
              background: '#000',
            }}
          >
            <img
              src={url}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.7,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <img
                src={playIconData}
                alt="Play"
                style={{
                  width: '80px',
                  height: '80px',
                }}
              />
              <div
                style={{
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 700,
                  textAlign: 'center',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {title}
              </div>
            </div>
          </div>
        )
        break

      case 'article':
        imageElement = (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '40px',
              background: 'linear-gradient(to bottom right, #f5f0ec, #fff)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <img
                src={logoData}
                alt="Logo"
                style={{
                  width: '48px',
                  height: '48px',
                }}
              />
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1a1a1a',
                }}
              >
                Farcaster Paywall
              </div>
            </div>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: '16px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#4a4a4a',
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          </div>
        )
        break

      case 'text':
        imageElement = (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '40px',
              background: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <img
                src={logoData}
                alt="Logo"
                style={{
                  width: '48px',
                  height: '48px',
                }}
              />
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1a1a1a',
                }}
              >
                Farcaster Paywall
              </div>
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: '16px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '24px',
                color: '#4a4a4a',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {text}
            </div>
          </div>
        )
        break

      default:
        imageElement = (
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
            <img
              src={logoData}
              alt="Logo"
              style={{
                width: '120px',
                height: '120px',
                marginBottom: '24px',
              }}
            />
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#1a1a1a',
                textAlign: 'center',
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
                  marginTop: '16px',
                }}
              >
                {description}
              </div>
            )}
          </div>
        )
    }

    return new ImageResponse(imageElement, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interBoldData,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interRegularData,
          weight: 400,
          style: 'normal',
        },
      ],
    })
  } catch (e) {
    console.error('Error generating OG image:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
} 