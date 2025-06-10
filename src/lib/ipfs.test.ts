import { uploadToIPFS, uploadJSONToIPFS } from './ipfs'

describe('IPFS Upload', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('should throw if API keys are missing', async () => {
    process.env.NEXT_PUBLIC_PINATA_API_KEY = ''
    process.env.NEXT_PUBLIC_PINATA_API_SECRET = ''
    await expect(uploadToIPFS(new File(['test'], 'test.txt'))).rejects.toThrow('Pinata API credentials not found')
  })

  it('should upload a file and return cid and url', async () => {
    process.env.NEXT_PUBLIC_PINATA_API_KEY = 'testkey'
    process.env.NEXT_PUBLIC_PINATA_API_SECRET = 'testsecret'
    const fakeCid = 'QmTestCid'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ IpfsHash: fakeCid })
    })
    const file = new File(['hello'], 'hello.txt')
    const result = await uploadToIPFS(file)
    expect(result.cid).toBe(fakeCid)
    expect(result.url).toContain(fakeCid)
  })

  it('should throw on upload error', async () => {
    process.env.NEXT_PUBLIC_PINATA_API_KEY = 'testkey'
    process.env.NEXT_PUBLIC_PINATA_API_SECRET = 'testsecret'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'fail' } })
    })
    const file = new File(['fail'], 'fail.txt')
    await expect(uploadToIPFS(file)).rejects.toThrow('Failed to upload to IPFS: fail')
  })

  it('should upload JSON and return cid and url', async () => {
    process.env.NEXT_PUBLIC_PINATA_API_KEY = 'testkey'
    process.env.NEXT_PUBLIC_PINATA_API_SECRET = 'testsecret'
    const fakeCid = 'QmJsonCid'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ IpfsHash: fakeCid })
    })
    const result = await uploadJSONToIPFS({ foo: 'bar' })
    expect(result.cid).toBe(fakeCid)
    expect(result.url).toContain(fakeCid)
  })
}) 