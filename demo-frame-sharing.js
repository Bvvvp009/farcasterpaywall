#!/usr/bin/env node

/**
 * Demo script showing how Farcaster Frame sharing works
 * Run with: node demo-frame-sharing.js
 */

// Simulated content examples
const contentExamples = [
  {
    title: "Amazing Photography Collection",
    description: "Exclusive photos from my latest trip to Iceland",
    contentType: "image",
    accessType: "paid",
    tipAmount: "5.00",
    contentUrl: "https://example.com/iceland-photos.jpg",
    customEmbedText: "Check out these stunning Iceland photos! 📸"
  },
  {
    title: "Free Tutorial: Web3 Basics",
    description: "Learn the fundamentals of Web3 and blockchain",
    contentType: "article",
    accessType: "free",
    contentUrl: null,
    customEmbedText: "Free Web3 tutorial for beginners! 🚀"
  },
  {
    title: "Premium Video Course",
    description: "Complete guide to building dApps",
    contentType: "video",
    accessType: "paid",
    tipAmount: "25.00",
    contentUrl: "https://example.com/dapp-course.mp4",
    customEmbedText: "Master dApp development with this comprehensive course! 💻"
  }
];

// Simulate Frame metadata generation
function generateFrameMetadata(content, frameUrl, appName = 'Farcaster Mini') {
  const imageUrl = content.contentType === 'image' && content.contentUrl 
    ? content.contentUrl 
    : '/og-image.png';

  const buttonTitle = content.accessType === 'paid' 
    ? `Pay ${content.tipAmount} USDC` 
    : 'View Content';

  return {
    version: "next",
    imageUrl,
    button: {
      title: buttonTitle,
      action: {
        type: "launch_frame",
        url: frameUrl,
        name: appName,
        splashImageUrl: imageUrl,
        splashBackgroundColor: "#f5f0ec"
      }
    }
  };
}

// Simulate Frame URL generation
function generateFrameUrl(contentCid, baseUrl = 'https://farcastermini.com') {
  return `${baseUrl}/content/${contentCid}`;
}

// Simulate Warpcast share URL
function generateWarpcastShareUrl(frameUrl, shareText) {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds=${encodeURIComponent(frameUrl)}`;
}

console.log('🚀 Farcaster Frame Sharing Demo\n');

contentExamples.forEach((content, index) => {
  const contentCid = `QmExample${index + 1}...`;
  const frameUrl = generateFrameUrl(contentCid);
  const frameMetadata = generateFrameMetadata(content, frameUrl);
  const warpcastUrl = generateWarpcastShareUrl(frameUrl, content.customEmbedText);

  console.log(`📄 Content ${index + 1}: ${content.title}`);
  console.log(`   Description: ${content.description}`);
  console.log(`   Type: ${content.contentType} (${content.accessType})`);
  if (content.accessType === 'paid') {
    console.log(`   Price: ${content.tipAmount} USDC`);
  }
  console.log(`   Custom Text: ${content.customEmbedText}`);
  console.log('');

  console.log('🔗 Frame URL:');
  console.log(`   ${frameUrl}`);
  console.log('');

  console.log('📋 Frame Metadata (fc:frame meta tag):');
  console.log(`   ${JSON.stringify(frameMetadata, null, 2)}`);
  console.log('');

  console.log('🌐 Warpcast Share URL:');
  console.log(`   ${warpcastUrl}`);
  console.log('');

  console.log('👀 How it appears in Farcaster:');
  console.log('   ┌─────────────────────────────────┐');
  console.log(`   │  📄 ${content.title.substring(0, 25)}${content.title.length > 25 ? '...' : ' '.repeat(25 - content.title.length)} │`);
  console.log('   │                                 │');
  const desc = content.description.substring(0, 25);
  console.log(`   │  ${desc}${desc.length > 25 ? '...' : ' '.repeat(25 - desc.length)} │`);
  console.log('   │                                 │');
  const buttonText = content.accessType === 'paid' ? `Pay ${content.tipAmount} USDC` : 'View Content';
  const buttonPadding = Math.max(0, 25 - buttonText.length);
  console.log(`   │  [${buttonText}]${' '.repeat(buttonPadding)} │`);
  console.log('   └─────────────────────────────────┘');
  console.log('');

  console.log('📱 HTML Meta Tag:');
  console.log(`   <meta name="fc:frame" content='${JSON.stringify(frameMetadata)}' />`);
  console.log('');

  console.log('─'.repeat(60));
  console.log('');
});

console.log('✨ Frame Sharing Benefits:');
console.log('   • Interactive content cards in Farcaster feeds');
console.log('   • Rich previews with custom images');
console.log('   • One-click access to view or purchase content');
console.log('   • Higher engagement than regular links');
console.log('   • Seamless integration with payment system');
console.log('');

console.log('🎯 How to use:');
console.log('   1. Upload content through the app');
console.log('   2. Copy the Frame URL from the success page');
console.log('   3. Share the URL in any Farcaster client');
console.log('   4. Content automatically appears as an interactive Frame');
console.log('   5. Users can click the button to view/pay for content');
console.log('');

console.log('🔧 Technical Implementation:');
console.log('   • Frame metadata generated automatically on upload');
console.log('   • fc:frame meta tag added to content pages');
console.log('   • Farcaster clients detect and render Frames');
console.log('   • Payment verification integrated with Frame actions');
console.log('   • Fallback handling for different content types'); 