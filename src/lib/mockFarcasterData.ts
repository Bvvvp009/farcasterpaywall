// Mock data for Farcaster Mini App testing in development

export const mockFarcasterUser = {
  fid: 12345,
  username: 'testuser',
  displayName: 'Test User',
  pfpUrl: 'https://i.seadn.io/gae/2hDpuTi-0AMKvoZJGd-yKWvK4tKdQr_kLIpB_qSeMau2TNGCNidAosMEvrEXFO9G6tmlFlPQplpwiqirgrIPWnCKMvElaYgI-HiVvXc?auto=format&w=1000',
  address: '0xe045C8F92AA2D42E12AAB7A17B5310CEFF2Ddb37',
  bio: 'Test user for development',
  followers: 100,
  following: 50,
  verifications: ['0x1234567890abcdef']
}

export const mockWalletStatus = {
  isConnected: true,
  isMiniApp: true,
  address: '0xe045C8F92AA2D42E12AAB7A17B5310CEFF2Ddb37',
  chainId: 8453 // Base mainnet
}

export const mockContentData = {
  contentId: 'test-content-123',
  title: 'Test Content',
  description: 'This is test content for development',
  contentType: 'text',
  price: '0.1',
  ciphertext: 'mock-ciphertext-data',
  dataToEncryptHash: 'mock-hash-data',
  ipfsCid: 'QmTestContentHash',
  creator: '0xe045C8F92AA2D42E12AAB7A17B5310CEFF2Ddb37',
  createdAt: new Date().toISOString()
}

export const mockPaymentResult = {
  success: true,
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  amount: '0.1'
}

// Mock SDK functions for development testing
export const mockFarcasterSDK = {
  isInMiniApp: async () => true,
  context: {
    user: mockFarcasterUser,
    client: {
      name: 'Warpcast',
      version: '1.0.0'
    }
  },
  wallet: {
    getEthereumProvider: async () => ({
      request: async (method: string, params?: any[]) => {
        switch (method) {
          case 'eth_accounts':
            return [mockFarcasterUser.address]
          case 'eth_chainId':
            return '0x2105' // Base mainnet
          default:
            return null
        }
      }
    })
  },
  actions: {
    ready: async () => console.log('Mock: Ready called'),
    signIn: async (params: any) => ({ success: true }),
    sendToken: async (params: any) => mockPaymentResult,
    composeCast: async (params: any) => ({ success: true })
  }
}

// Development testing utilities
export const enableMockMode = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Mock mode enabled for Farcaster SDK testing')
    return true
  }
  return false
}

export const getMockData = (type: 'user' | 'wallet' | 'content' | 'payment') => {
  switch (type) {
    case 'user':
      return mockFarcasterUser
    case 'wallet':
      return mockWalletStatus
    case 'content':
      return mockContentData
    case 'payment':
      return mockPaymentResult
    default:
      return null
  }
} 