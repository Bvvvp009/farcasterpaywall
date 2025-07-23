import { Metadata } from 'next'
import { getContent, generateFrameMetadata } from '../../../lib/contentStorage'

interface Props {
  params: {
    cid: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const content = getContent(params.cid)
  
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.farcasterpaywall.fun'
  const frameMetadata = generateFrameMetadata(content, baseUrl)

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