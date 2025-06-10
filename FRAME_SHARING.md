# Frame Sharing Implementation

This document describes the Frame sharing functionality implemented in the Farcaster Mini App.

## Overview

The Frame sharing system allows creators to share their content as interactive Farcaster Frames. When users share a Frame URL, it appears as a rich, interactive embed in Farcaster feeds with a custom image and call-to-action button.

## How It Works

### 1. Frame Metadata Generation

Each content page automatically generates Frame metadata using the `fc:frame` meta tag:

```html
<meta name="fc:frame" content='{"version":"next","imageUrl":"...","button":{"title":"...","action":{"type":"launch_frame","url":"..."}}}' />
```

### 2. Frame URL Structure

Frame URLs follow this pattern:
```
https://yourdomain.com/content/{contentCid}
```

### 3. Frame Components

#### FrameShare Component
A reusable React component that provides:
- Frame URL display and copying
- Direct Warpcast sharing
- System share sheet integration
- Frame preview
- Multiple size variants (sm, md, lg)

#### Frame Utilities (`src/lib/frame-utils.ts`)
Utility functions for:
- Generating Frame metadata
- Creating share URLs
- Copying to clipboard
- Validating Frame metadata

## Usage

### Basic Frame Sharing

```tsx
import { FrameShare } from './components/FrameShare'

<FrameShare
  contentCid="QmExample..."
  content={{
    title: "My Content",
    description: "Amazing content description",
    contentType: "image",
    accessType: "paid",
    tipAmount: "1.00"
  }}
/>
```

### Custom Frame Metadata

```tsx
import { generateFrameMetadata } from './lib/frame-utils'

const frameMetadata = generateFrameMetadata(
  content,
  frameUrl,
  'My App Name'
)
```

### Manual Frame URL Generation

```tsx
import { generateFrameUrl } from './lib/frame-utils'

const frameUrl = generateFrameUrl(contentCid)
```

## Frame Metadata Schema

```typescript
interface FrameMetadata {
  version: "next" | "1"
  imageUrl: string // Max 1024 chars, 3:2 aspect ratio, <10MB
  button: {
    title: string // Max 32 chars
    action: {
      type: "launch_frame"
      url: string // Max 1024 chars
      name?: string
      splashImageUrl?: string
      splashBackgroundColor?: string
    }
  }
}
```

## Content Types

The system supports different content types with appropriate Frame configurations:

- **Images**: Uses the actual image as the Frame image
- **Videos**: Uses a default OG image
- **Text/Articles**: Uses a default OG image with content preview

## Access Types

- **Free Content**: Button shows "View Content"
- **Paid Content**: Button shows "Pay X USDC"

## Sharing Options

### 1. Warpcast Direct Share
Opens Warpcast compose with pre-filled text and Frame embed.

### 2. System Share Sheet
Uses the Web Share API when available, falls back to clipboard.

### 3. Manual Copy
Copy the Frame URL to share manually.

## Frame Preview

The FrameShare component includes a visual preview showing:
- Content title and description
- Appropriate button text based on access type
- 3:2 aspect ratio preview matching Farcaster's display

## Testing

### Local Development
Use `cloudflared` to expose your local server:
```bash
cloudflared tunnel --url http://localhost:3000
```

### Frame Testing
Use Warpcast's [Mini App Embed Tool](https://warpcast.com/~/developers/mini-apps/embed) to test your Frames.

## Caching

Frame metadata is cached by Farcaster clients. Once a URL is shared, the metadata is attached to the cast and won't update even if you change the metadata later.

## Best Practices

1. **Image Optimization**: Use optimized images for Frame previews
2. **Descriptive Titles**: Make button text clear and actionable
3. **Consistent Branding**: Use consistent colors and styling
4. **Test Thoroughly**: Always test Frames before sharing
5. **Fallback Handling**: Provide fallbacks for sharing when Web Share API isn't available

## Integration Points

### CreateContent Component
- Automatically shows Frame sharing after successful upload
- Uses custom embed text if provided
- Provides "Create Another" option

### TestUpload Component
- Includes Frame sharing for testing purposes
- Uses smaller size variant for compact display

### Content Pages
- Automatically generate Frame metadata
- Support both free and paid content types

## Extending the System

### Adding New Content Types
1. Update the `ContentType` interface
2. Add appropriate image handling in `generateFrameMetadata`
3. Update the FrameShare component preview

### Custom Sharing Platforms
1. Add new sharing methods to `frame-utils.ts`
2. Update the FrameShare component with new buttons
3. Test with the target platform

### Enhanced Metadata
1. Extend the `FrameMetadata` interface
2. Update validation in `validateFrameMetadata`
3. Modify the content page metadata generation

## Troubleshooting

### Common Issues

1. **Frame not appearing**: Check that the `fc:frame` meta tag is present and valid
2. **Image not loading**: Verify image URL is accessible and meets size requirements
3. **Button not working**: Ensure the action URL is correct and accessible
4. **Caching issues**: Remember that Frame metadata is cached by Farcaster

### Debug Steps

1. Use browser dev tools to check the meta tag
2. Validate Frame metadata using `validateFrameMetadata`
3. Test the Frame URL directly
4. Check Warpcast's embed tool for errors

## Security Considerations

- Frame URLs are public and can be accessed by anyone
- Don't include sensitive information in Frame metadata
- Validate all user inputs before generating Frame metadata
- Use HTTPS for all Frame URLs in production 