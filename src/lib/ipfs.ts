export type UploadResult = {
  cid: string
  url: string
}

// Basic CID validation - checks if it's a valid IPFS CID format
export function isValidCID(cid: string): boolean {
  // IPFS CIDs typically start with Qm (v0) or b (v1)
  // This is a basic check - in production you might want more sophisticated validation
  return /^Qm[a-zA-Z0-9]{44}$/.test(cid) || /^b[a-zA-Z0-9]{58}$/.test(cid)
}

// Validate IPFS environment variables
export function validateIPFSConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!process.env.NEXT_PUBLIC_PINATA_API_KEY) {
    errors.push('NEXT_PUBLIC_PINATA_API_KEY is not set')
  }
  
  if (!process.env.NEXT_PUBLIC_PINATA_API_SECRET) {
    errors.push('NEXT_PUBLIC_PINATA_API_SECRET is not set')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export async function uploadToIPFS(file: File): Promise<UploadResult> {
  // Validate configuration first
  const config = validateIPFSConfig()
  if (!config.valid) {
    throw new Error(`IPFS configuration error: ${config.errors.join(', ')}`)
  }

  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY!
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET!

  // Create form data
  const formData = new FormData()
  formData.append('file', file)

  try {
    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to upload to IPFS: ${error.error?.details || error.error?.message || 'Unknown error'}`)
    }

    const { IpfsHash: cid } = await response.json()
    
    // Validate the returned CID
    if (!cid || !isValidCID(cid)) {
      throw new Error('Invalid CID received from IPFS upload')
    }
    
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`

    return { cid, url }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to upload to IPFS: Unknown error')
  }
}

export async function uploadJSONToIPFS(data: any): Promise<UploadResult> {
  // Validate configuration first
  const config = validateIPFSConfig()
  if (!config.valid) {
    throw new Error(`IPFS configuration error: ${config.errors.join(', ')}`)
  }

  try {
    // Create blob from JSON
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const file = new File([blob], 'metadata.json', { type: 'application/json' })

    // Upload using the same function
    return uploadToIPFS(file)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to upload JSON to IPFS: Unknown error')
  }
}

export function getIPFSGatewayURL(cid: string): string {
  if (!isValidCID(cid)) {
    throw new Error('Invalid CID format')
  }
  return `https://gateway.pinata.cloud/ipfs/${cid}`
}

// Verify that content is actually available on IPFS
export async function verifyIPFSContent(cid: string, timeoutMs: number = 5000): Promise<boolean> {
  if (!isValidCID(cid)) {
    return false
  }

  try {
    const url = getIPFSGatewayURL(cid)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading the full content
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn(`Failed to verify IPFS content ${cid}:`, error)
    return false
  }
} 