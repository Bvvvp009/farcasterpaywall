import { create } from '@web3-storage/w3up-client'
import { identity } from '@web3-storage/w3up-client/identity'

export type UploadResult = {
  cid: string
  url: string
}

export async function uploadToIPFS(file: File): Promise<UploadResult> {
  const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN
  if (!token) {
    throw new Error('Web3 Storage token not found')
  }

  const client = await create()
  const identity = await identity.fromKey(token)
  await client.login(identity)
  await client.setCurrentSpace(identity.did())

  const cid = await client.uploadFile(file)
  const url = `https://${cid}.ipfs.w3s.link`

  return { cid, url }
}

export async function uploadJSONToIPFS(data: any): Promise<UploadResult> {
  const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN
  if (!token) {
    throw new Error('Web3 Storage token not found')
  }

  const client = await create()
  const identity = await identity.fromKey(token)
  await client.login(identity)
  await client.setCurrentSpace(identity.did())

  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const cid = await client.uploadBlob(blob)
  const url = `https://${cid}.ipfs.w3s.link`

  return { cid, url }
}

export function getIPFSGatewayURL(cid: string): string {
  return `https://${cid}.ipfs.w3s.link`
} 