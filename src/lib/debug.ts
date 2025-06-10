import { testContentStore } from './store'
import { isValidCID, verifyIPFSContent } from './ipfs'

export interface DebugInfo {
  cid: string
  isValid: boolean
  inStore: boolean
  storeKey: string
  ipfsAvailable: boolean
  storeSize: number
  availableKeys: string[]
}

export async function debugContent(cid: string): Promise<DebugInfo> {
  const isValid = isValidCID(cid)
  const storeKey = `content_${cid}`
  const inStore = testContentStore.has(storeKey)
  const ipfsAvailable = isValid ? await verifyIPFSContent(cid, 5000) : false
  
  return {
    cid,
    isValid,
    inStore,
    storeKey,
    ipfsAvailable,
    storeSize: testContentStore.size,
    availableKeys: Array.from(testContentStore.keys()).slice(0, 10)
  }
}

export function logDebugInfo(info: DebugInfo) {
  console.log('=== Content Debug Info ===')
  console.log(`CID: ${info.cid}`)
  console.log(`Valid CID format: ${info.isValid}`)
  console.log(`In store: ${info.inStore}`)
  console.log(`Store key: ${info.storeKey}`)
  console.log(`IPFS available: ${info.ipfsAvailable}`)
  console.log(`Store size: ${info.storeSize}`)
  console.log(`Available keys:`, info.availableKeys)
  console.log('=========================')
} 