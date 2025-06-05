import { Metadata } from 'next'
import { testContentStore } from '../../../lib/store'
import ContentView from '../../../components/ContentView'

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

  // Build frame metadata
  const frameMetadata = {
    version: "vNext",
    imageUrl: content.contentType === 'image' ? content.contentUrl : '/og-image.png',
    button: {
      title: content.accessType === 'paid' ? `Pay ${content.tipAmount} USDC` : 'View Content',
      action: {
        type: "launch_frame",
        url: `${process.env.NEXT_PUBLIC_APP_URL}/content/${params.cid}`,
        name: content.title,
        splashImageUrl: content.contentType === 'image' ? content.contentUrl : '/og-image.png',
        splashBackgroundColor: "#f5f0ec"
      }
    }
  };

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