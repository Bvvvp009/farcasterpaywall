import { Metadata } from 'next'
import { testContentStore } from '../../../lib/store'

interface Props {
  params: {
    cid: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const content = testContentStore.get(`content_${params.cid}`)
  
  if (!content) {
    return {
      title: 'Content Not Found',
      description: 'The requested content could not be found.',
      openGraph: {
        images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og/error`],
      },
      other: {
        'fc:frame': JSON.stringify({
          version: 'next',
          imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/og/error`,
          button: {
            title: 'Try Again',
            action: {
              type: 'launch_frame',
              url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${params.cid}`,
            }
          }
        })
      }
    }
  }

  const frameMetadata = {
    version: 'next',
    imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/og/${params.cid}`,
    button: {
      title: content.accessType === 'paid' ? `Pay ${content.tipAmount} USDC` : 'View Content',
      action: {
        type: 'launch_frame',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${params.cid}`,
        name: 'Farcaster Paywall',
        splashImageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/splash.png`,
        splashBackgroundColor: '#fdf2f8'
      }
    }
  }

  return {
    title: content.title,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og/${params.cid}`],
    },
    other: {
      'fc:frame': JSON.stringify(frameMetadata)
    }
  }
}

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 