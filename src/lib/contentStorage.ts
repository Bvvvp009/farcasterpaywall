// Content Storage System for Hybrid Wallet
// Stores content metadata and handles frame generation

export interface ContentMetadata {
  contentId: string
  title: string
  description: string
  contentType: 'text' | 'image' | 'video' | 'article'
  price: string
  creator: string
  ipfsCid: string
  createdAt: string
  accessType: 'free' | 'paid'
  customEmbedText?: string
}

// In-memory storage for demo purposes
// In production, this would be a database
const contentStore = new Map<string, ContentMetadata>()

/**
 * Store content metadata
 */
export function storeContent(content: ContentMetadata): void {
  console.log('📦 Storing content:', content.contentId)
  contentStore.set(content.contentId, content)
  
  // Also store with bytes32 format for contract compatibility
  const bytes32ContentId = `0x${content.contentId.replace(/[^a-f0-9]/gi, '').padEnd(64, '0')}`
  contentStore.set(bytes32ContentId, content)
}

/**
 * Get content metadata by ID
 */
export function getContent(contentId: string): ContentMetadata | null {
  console.log('🔍 Looking for content:', contentId)
  
  // Try exact match first
  let content = contentStore.get(contentId)
  
  // If not found, try bytes32 format
  if (!content) {
    const bytes32ContentId = `0x${contentId.replace(/[^a-f0-9]/gi, '').padEnd(64, '0')}`
    content = contentStore.get(bytes32ContentId)
  }
  
  // If still not found, try reverse lookup
  if (!content) {
    const entries = Array.from(contentStore.entries())
    for (const [key, value] of entries) {
      if (value.contentId === contentId || key === contentId) {
        content = value
        break
      }
    }
  }
  
  if (content) {
    console.log('✅ Found content:', content.title)
  } else {
    console.log('❌ Content not found:', contentId)
  }
  
  return content || null
}

/**
 * Get all content for a creator
 */
export function getCreatorContent(creatorAddress: string): ContentMetadata[] {
  const creatorContent: ContentMetadata[] = []
  
  const values = Array.from(contentStore.values())
  for (const content of values) {
    if (content.creator.toLowerCase() === creatorAddress.toLowerCase()) {
      creatorContent.push(content)
    }
  }
  
  return creatorContent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Generate frame metadata for content
 */
export function generateFrameMetadata(content: ContentMetadata, baseUrl: string): any {
  const imageUrl = content.contentType === 'image' && content.ipfsCid
    ? `https://gateway.pinata.cloud/ipfs/${content.ipfsCid}`
    : `${baseUrl}/api/og?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}&price=${content.price}`

  const buttonTitle = content.accessType === 'paid' 
    ? `Pay ${content.price} USDC` 
    : 'View Content'

  return {
    version: "next",
    imageUrl,
    button: {
      title: buttonTitle,
      action: {
        type: "launch_frame",
        url: `${baseUrl}/content/${content.contentId}`,
        name: "Farcaster Mini",
        splashImageUrl: imageUrl,
        splashBackgroundColor: "#f5f0ec"
      }
    }
  }
}

/**
 * Generate share text for content
 */
export function generateShareText(content: ContentMetadata, customText?: string): string {
  const baseText = `${content.title}\n\n${content.description}`
  
  if (content.accessType === 'paid') {
    return `${baseText}\n\n💰 Premium Content - ${content.price} USDC\n\n${customText || 'Unlock exclusive content!'}`
  }
  
  return `${baseText}\n\n${customText || 'Check out this content!'}`
}

/**
 * Get content statistics
 */
export function getContentStats(): { total: number; paid: number; free: number } {
  let total = 0
  let paid = 0
  let free = 0
  
  const values = Array.from(contentStore.values())
  for (const content of values) {
    total++
    if (content.accessType === 'paid') {
      paid++
    } else {
      free++
    }
  }
  
  return { total, paid, free }
}

/**
 * Clear all content (for testing)
 */
export function clearAllContent(): void {
  contentStore.clear()
  console.log('🗑️ All content cleared')
}

/**
 * Get all content (for debugging)
 */
export function getAllContent(): ContentMetadata[] {
  return Array.from(contentStore.values())
} 