/**
 * Frame utilities for Farcaster Mini Apps
 * Handles Frame metadata generation and sharing functionality
 */

export interface FrameMetadata {
  version: string
  imageUrl: string
  button: {
    title: string
    action: {
      type: string
      url: string
      name?: string
      splashImageUrl?: string
      splashBackgroundColor?: string
    }
  }
}

export interface ContentMetadata {
  title: string
  description: string
  contentType: 'image' | 'video' | 'text' | 'article'
  accessType: 'free' | 'paid'
  tipAmount?: string
  contentUrl?: string
  customEmbedText?: string
}

/**
 * Generate Frame metadata for a content piece
 */
export function generateFrameMetadata(
  content: ContentMetadata,
  frameUrl: string,
  appName: string = 'Farcaster Mini'
): FrameMetadata {
  const imageUrl = content.contentType === 'image' && content.contentUrl 
    ? content.contentUrl 
    : '/og-image.png' // Default OG image

  const buttonTitle = content.accessType === 'paid' 
    ? `Pay ${content.tipAmount} USDC` 
    : 'View Content'

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
  }
}

/**
 * Generate a shareable text for social media
 */
export function generateShareText(
  content: ContentMetadata,
  customText?: string
): string {
  if (customText) {
    return customText
  }

  const typeText = content.accessType === 'paid' ? 'exclusive' : 'amazing'
  return `Check out this ${typeText} ${content.contentType}: ${content.title}`
}

/**
 * Generate Warpcast compose URL with Frame embed
 */
export function generateWarpcastShareUrl(
  frameUrl: string,
  shareText: string
): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds=${encodeURIComponent(frameUrl)}`
}

/**
 * Generate Frame URL for a content piece
 */
export function generateFrameUrl(contentCid: string, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin}/content/${contentCid}`
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      document.body.removeChild(textArea)
      return result
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Share content using Web Share API with fallback
 */
export async function shareContent(
  title: string,
  text: string,
  url: string
): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url
      })
      return true
    } else {
      // Fallback to clipboard
      const fullText = `${text}\n\n${url}`
      return await copyToClipboard(fullText)
    }
  } catch (error) {
    console.error('Failed to share content:', error)
    return false
  }
}

/**
 * Validate Frame metadata
 */
export function validateFrameMetadata(metadata: FrameMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!metadata.version || !['next', '1'].includes(metadata.version)) {
    errors.push('Invalid version. Must be "next" or "1"')
  }

  if (!metadata.imageUrl) {
    errors.push('Missing imageUrl')
  } else if (metadata.imageUrl.length > 1024) {
    errors.push('imageUrl must be 1024 characters or less')
  }

  if (!metadata.button?.title) {
    errors.push('Missing button title')
  } else if (metadata.button.title.length > 32) {
    errors.push('Button title must be 32 characters or less')
  }

  if (!metadata.button?.action?.type || metadata.button.action.type !== 'launch_frame') {
    errors.push('Invalid action type. Must be "launch_frame"')
  }

  if (!metadata.button?.action?.url) {
    errors.push('Missing action URL')
  } else if (metadata.button.action.url.length > 1024) {
    errors.push('Action URL must be 1024 characters or less')
  }

  return {
    valid: errors.length === 0,
    errors
  }
} 