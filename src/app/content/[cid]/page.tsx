import { Metadata } from 'next'
import ContentView from '../../../components/ContentView'
import { generateFrameUrl } from '../../../lib/frame-utils'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.farcasterpaywall.fun'

export async function generateMetadata({ params }: { params: { cid: string } }): Promise<Metadata> {
  // Fetch content metadata from your backend
  const res = await fetch(`${APP_URL}/api/content/${params.cid}`);
  let frameMetadata;
  let title = 'Content Not Found';
  let description = 'The requested content could not be found.';
  let ogImage = `${APP_URL}/notfound.jpg`;

  if (res.ok) {
    const content = await res.json();
    title = content.title;
    description = content.description;
    // For paid/encrypted content, add ?action=pay to the frame URL
    const frameUrl = content.accessType === 'paid'
      ? `${APP_URL}/content/${params.cid}?action=pay`
      : generateFrameUrl(params.cid, APP_URL);
    if (content.accessType === 'paid') {
      // Paid/encrypted content: show locked image and generic description
      frameMetadata = {
        version: 'next',
        imageUrl: `${APP_URL}/locked.png`,
        button: {
          title: `Pay ${content.tipAmount} USDC`,
          action: {
            type: 'launch_frame',
            url: frameUrl,
            name: 'Farcaster Paywall',
            splashImageUrl: `${APP_URL}/splash.png`,
            splashBackgroundColor: '#ffffff',
          },
        },
      };
      ogImage = `${APP_URL}/locked.png`;
      description = `Unlock this content by tipping ${content.tipAmount} USDC.`;
    } else {
      // Free content: show actual image or default OG image
      frameMetadata = {
        version: 'next',
        imageUrl: content.contentType === 'image' ? content.contentUrl : `${APP_URL}/ogimage.png`,
        button: {
          title: 'View Content',
          action: {
            type: 'launch_frame',
            url: frameUrl,
            name: 'Farcaster Paywall',
            splashImageUrl: `${APP_URL}/splash.png`,
            splashBackgroundColor: '#ffffff',
          },
        },
      };
      ogImage = content.contentType === 'image' ? content.contentUrl : `${APP_URL}/ogimage.png`;
    }
  } else {
    // Not found: show notfound image and message
    frameMetadata = {
      version: 'next',
      imageUrl: `${APP_URL}/notfound.jpg`,
      button: {
        title: 'Content Either Encrypted or Not Found',
        action: {
          type: 'launch_frame',
          url: `${APP_URL}/content/${params.cid}`,
          name: 'Farcaster Paywall',
        },
      },
    };
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImage],
    },
    other: {
      'fc:frame': JSON.stringify(frameMetadata),
    },
  };
}

export default function ContentPage({ params }: { params: { cid: string } }) {
  return <ContentView cid={params.cid} />
} 