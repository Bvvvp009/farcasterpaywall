'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import Link from 'next/link'

export default function HomePage() {
  useEffect(() => {
    // Initialize the Mini App
    const initMiniApp = async () => {
      try {
        console.log('Initializing Mini App...')
        // Check if we're in a Mini App environment
        const isMiniApp = await sdk.isInMiniApp()
        console.log('Is Mini App environment:', isMiniApp)
        
        if (isMiniApp) {
          console.log('App loaded, calling ready()...')
          // Hide the splash screen when the app is ready
          await sdk.actions.ready()
          console.log('ready() called successfully')
        }
      } catch (error) {
        console.error('Failed to initialize Mini App:', error)
      }
    }

    // Call initMiniApp immediately when component mounts
    initMiniApp()
  }, [])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4 text-blue-800">
            🔐 Lit Protocol Content Access
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Test Lit Protocol encryption/decryption with smart contract access control.
            Upload, encrypt, and manage content with on-chain payment verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/lit" className="group">
              <div className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-blue-200">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Lit Protocol Test</h3>
                <p className="text-blue-600 text-sm">Test encryption, decryption, and content management</p>
              </div>
            </Link>

            <Link href="/create" className="group">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Create Content</h3>
                <p className="text-gray-600 text-sm">Upload and encrypt premium content</p>
              </div>
            </Link>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">Lit Protocol Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">1. Encrypt</h3>
                <p className="text-gray-600">
                  Encrypt content with Lit Protocol using smart contract access control.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-green-800">2. Upload</h3>
                <p className="text-gray-600">
                  Upload encrypted content to IPFS and register on-chain.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">3. Pay</h3>
                <p className="text-gray-600">
                  Users pay through smart contract to gain access.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-green-800">4. Decrypt</h3>
                <p className="text-gray-600">
                  Decrypt content only after payment verification.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
            <h2 className="text-2xl font-semibold mb-4 text-green-800">Content Types Supported</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-green-800">📝 Text</h3>
                <p className="text-gray-600">
                  Encrypt any text content with custom access control.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-green-800">📋 JSON</h3>
                <p className="text-gray-600">
                  Encrypt structured data and configuration files.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-green-800">📁 Files</h3>
                <p className="text-gray-600">
                  Encrypt any text-based file format.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h2 className="text-lg font-semibold mb-2 text-yellow-800">⚠️ Important</h2>
            <p className="text-yellow-700">
              Make sure to set your <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_PRIVATE_KEY</code> environment variable 
              and deploy your ContentAccess contract before testing.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}