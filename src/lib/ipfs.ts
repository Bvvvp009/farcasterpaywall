export type UploadResult = {
  cid: string
  url: string
}

export async function uploadToIPFS(file: File): Promise<UploadResult> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('Pinata API credentials not found')
  }

  // Create form data
  const formData = new FormData()
  formData.append('file', file)

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
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`

  return { cid, url }
}

export async function uploadJSONToIPFS(data: any): Promise<UploadResult> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('Pinata API credentials not found')
  }

  // Create blob from JSON
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const file = new File([blob], 'metadata.json', { type: 'application/json' })

  // Upload using the same function
  return uploadToIPFS(file)
}

export function getIPFSGatewayURL(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`
} 