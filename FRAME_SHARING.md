# Farcaster Frame Sharing Guide

## Overview

This guide explains how to share your uploaded content as interactive Farcaster Frames instead of regular links.

## What are Farcaster Frames?

Farcaster Frames are interactive content cards that appear in Farcaster feeds. Unlike regular links that show basic previews, Frames provide rich, interactive experiences with buttons and custom actions.

## How Frame Sharing Works

### 1. Automatic Frame Metadata

When you upload content, the system automatically generates Frame metadata and includes it in the content page. This metadata is added as a `fc:frame` meta tag in the HTML head:

```html
<meta name="fc:frame" content='{"version":"next","imageUrl":"https://example.com/image.jpg","button":{"title":"View Content","action":{"type":"launch_frame","url":"https://example.com/content/cid123","name":"Farcaster Mini","splashImageUrl":"https://example.com/image.jpg","splashBackgroundColor":"#f5f0ec"}}}' />
```

### 2. Frame Structure

The Frame metadata includes:

- **version**: "next" (current Frame version)
- **imageUrl**: The image to display in the Frame
- **button.title**: The text on the interactive button
- **button.action.type**: "launch_frame" (opens the content)
- **button.action.url**: The URL to open when clicked
- **button.action.name**: App name for the splash screen
- **button.action.splashImageUrl**: Image for the splash screen
- **button.action.splashBackgroundColor**: Background color for splash

### 3. Sharing Process

1. **Upload Content**: When you upload content, the system generates Frame metadata
2. **Get Frame URL**: The content page URL contains the Frame metadata
3. **Share URL**: Share the content URL in any Farcaster client
4. **Automatic Detection**: Farcaster clients detect the `fc:frame` meta tag
5. **Interactive Display**: The content appears as an interactive Frame with a button

## Frame Examples

### Free Content Frame
```json
{
  "version": "next",
  "imageUrl": "https://example.com/content-image.jpg",
  "button": {
    "title": "View Content",
    "action": {
      "type": "launch_frame",
      "url": "https://example.com/content/cid123",
      "name": "Farcaster Mini",
      "splashImageUrl": "https://example.com/content-image.jpg",
      "splashBackgroundColor": "#f5f0ec"
    }
  }
}
```

### Paid Content Frame
```json
{
  "version": "next",
  "imageUrl": "https://example.com/premium-content.jpg",
  "button": {
    "title": "Pay 5 USDC",
    "action": {
      "type": "launch_frame",
      "url": "https://example.com/content/cid456",
      "name": "Farcaster Mini",
      "splashImageUrl": "https://example.com/premium-content.jpg",
      "splashBackgroundColor": "#f5f0ec"
    }
  }
}
```

## How to Share Your Content

### Method 1: Direct URL Sharing
1. Copy the Frame URL from the upload success page
2. Paste it directly in any Farcaster client (Warpcast, etc.)
3. The content will automatically appear as an interactive Frame

### Method 2: Warpcast Integration
1. Click "Share on Warpcast" button
2. This opens Warpcast with the Frame URL pre-filled
3. Post the content - it will appear as a Frame

### Method 3: System Share
1. Click the "Share" button
2. Use your system's share sheet
3. Share to any Farcaster client

## Frame Preview

When shared in Farcaster, your content will appear like this:

```
┌─────────────────────────────────┐
│  📄 Your Content Title          │
│                                 │
│  Your content description...    │
│                                 │
│  [View Content] or [Pay 5 USDC] │
└─────────────────────────────────┘
```

## Technical Details

### Frame Metadata Generation

The system automatically generates Frame metadata based on:

- **Content Type**: Image, video, text, or article
- **Access Type**: Free or paid content
- **Content URL**: Direct link to content (for images)
- **Tip Amount**: For paid content
- **Custom Text**: Any custom embed text

### Validation

Frame metadata is validated to ensure:
- Image URLs are under 1024 characters
- Button titles are under 32 characters
- All required fields are present
- URLs are properly formatted

### Fallbacks

- If no content image is available, uses default OG image
- If content type is not image, uses default preview image
- Maintains consistent branding across all Frames

## Benefits of Frame Sharing

1. **Interactive Experience**: Users can interact directly with your content
2. **Rich Previews**: Beautiful, branded previews in feeds
3. **Direct Actions**: One-click access to view or purchase content
4. **Better Engagement**: Higher engagement than regular links
5. **Native Integration**: Seamless experience within Farcaster

## Troubleshooting

### Frame Not Appearing
- Ensure the content URL is accessible
- Check that Frame metadata is properly generated
- Verify the `fc:frame` meta tag is present in page source

### Button Not Working
- Confirm the action URL is correct
- Check that the content page loads properly
- Verify payment integration for paid content

### Image Not Loading
- Ensure image URL is publicly accessible
- Check image file size (under 10MB)
- Verify image format is supported

## Best Practices

1. **Use High-Quality Images**: Frame images should be clear and engaging
2. **Clear Call-to-Action**: Button text should clearly indicate the action
3. **Consistent Branding**: Use consistent colors and styling
4. **Test Before Sharing**: Always test your Frames before sharing
5. **Monitor Performance**: Track Frame engagement and optimize

## Integration with Payment System

For paid content, the Frame system integrates with the payment verification:

1. User clicks "Pay X USDC" button in Frame
2. Frame opens the content page
3. Content page checks payment proof
4. If verified, content is decrypted and displayed
5. If not verified, payment flow is initiated

This creates a seamless experience from discovery to purchase to consumption. 