import { Metadata } from 'next'
import { testContentStore } from '../../../lib/store'
import ContentView from '../../../components/ContentView'
import { generateFrameMetadata, generateFrameUrl } from '../../../lib/frame-utils'

export async function generateMetadata({ params }: { params: { cid: string } }): Promise<Metadata> {
  // Fetch content metadata from your backend
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/content/${params.cid}`);
  if (!res.ok) {
    return {
      title: 'Content Not Found',
      description: 'The requested content could not be found.',
    };
  }
  const content = await res.json();

  // Generate Frame URL
  const frameUrl = generateFrameUrl(params.cid, process.env.NEXT_PUBLIC_APP_URL)

  // Build frame metadata using utility function
  const frameMetadata = generateFrameMetadata(
    {
      title: content.title,
      description: content.description,
      contentType: content.contentType,
      accessType: content.accessType,
      tipAmount: content.tipAmount,
      contentUrl: content.contentUrl,
      customEmbedText: content.customEmbedText
    },
    frameUrl,
    'Farcaster Mini'
  );

  return {
    title: content.title,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      images: [content.contentType === 'image' ? content.contentUrl : '/og-image.png'],
    },
    other: {
      'fc:frame': JSON.stringify(frameMetadata)
    },
  };
}

export default function ContentPage({ params }: { params: { cid: string } }) {
  return <ContentView cid={params.cid} />
} 