// 'use client'

// import React, { useState, useEffect } from 'react'
// import { uploadAndEncrypt, payForContentWithUSDC } from '../lib/uploadEncrypt'
// import { decryptContent } from '../lib/payAndDecrypt'
// import { getUserUploadedContent, UserContent } from '../lib/userContent'
// import { autoDecryptContent, AutoDecryptResult, autoCheckAndDecryptForSigner, autoCheckAndDecryptForFarcaster } from '../lib/autoDecrypt'
// import { 
//   getFarcasterUser, 
//   getFarcasterWalletAddress, 
//   payForContentWithFarcasterWallet,
//   checkContentAccess,
//   initializeFarcasterApp,
//   accessContentWithFarcaster,
//   FarcasterUser 
// } from '../lib/farcasterWallet'
// import { ethers } from 'ethers'
// import { sdk } from '@farcaster/frame-sdk'

// type ContentType = 'text' | 'json' | 'file'

// interface TestResult {
//   icon: string
//   message: string
//   isError?: boolean
// }

// export default function LitProtocolTest() {
//   const [contentType, setContentType] = useState<ContentType>('text')
//   const [textContent, setTextContent] = useState('This is a secret message that requires payment to decrypt!')
//   const [jsonContent, setJsonContent] = useState(JSON.stringify({
//     title: "Premium Content",
//     description: "This is premium JSON content",
//     data: {
//       secret: "hidden_value",
//       timestamp: new Date().toISOString(),
//       access: "premium_only"
//     }
//   }, null, 2))
//   const [selectedFile, setSelectedFile] = useState<File | null>(null)
//   const [contentId, setContentId] = useState('test-content-1')
//   const [price, setPrice] = useState('0.001')
//   const [userAddress, setUserAddress] = useState('')
//   const [userContent, setUserContent] = useState<UserContent[]>([])
//   const [selectedUserContent, setSelectedUserContent] = useState<UserContent | null>(null)
//   const [results, setResults] = useState<TestResult[]>([])
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
//   const [isFarcasterApp, setIsFarcasterApp] = useState(false)
//   const [autoDecryptResults, setAutoDecryptResults] = useState<AutoDecryptResult[]>([])
//   const [currentSigner, setCurrentSigner] = useState<ethers.Signer | null>(null)
//   const [uploadedData, setUploadedData] = useState<{
//     cid: string
//     contentId: string
//     originalContentId: string
//     dataToEncryptHash: string
//     originalContent: string
//     ciphertext: string
//     contentType: ContentType
//     creator: string
//     price: string
//   } | null>(null)

//   // Initialize Farcaster app on component mount
//   useEffect(() => {
//     const initFarcaster = async () => {
//       try {
//         const isMiniApp = await initializeFarcasterApp()
//         setIsFarcasterApp(isMiniApp)
        
//         if (isMiniApp) {
//           const user = await getFarcasterUser()
//           setFarcasterUser(user)
          
//           if (user?.address) {
//             setUserAddress(user.address)
//             // Set up Farcaster signer
//             const provider = await sdk.wallet.getEthereumProvider()
//             if (provider) {
//               const ethersProvider = new ethers.BrowserProvider(provider)
//               const signer = await ethersProvider.getSigner()
//               setCurrentSigner(signer)
//             }
//             await fetchUserContent()
//           }
//         } else {
//           // Not in Farcaster Mini App - show message
//           console.log("Not in Farcaster Mini App environment")
//           addResult('❌', 'This app requires Farcaster Mini App environment', false)
//         }
//       } catch (error) {
//         console.error('Error initializing Farcaster:', error)
//         addResult('❌', 'Failed to initialize Farcaster Mini App', false)
//       }
//     }
    
//     initFarcaster()
//   }, [])

//   const fetchUserContent = async () => {
//     if (!userAddress) return
    
//     try {
//       const content = await getUserUploadedContent(userAddress)
//       setUserContent(content)
//       addResult('📋', `Found ${content.length} uploaded content items`)
//     } catch (error) {
//       console.error('Error fetching user content:', error)
//       addResult('❌', 'Failed to fetch user content', false)
//     }
//   }

//   const addResult = (icon: string, message: string, isError = false) => {
//     setResults(prev => [...prev, { icon, message, isError }])
//   }

//   const clearResults = () => {
//     setResults([])
//     setAutoDecryptResults([])
//   }

//   const getContentToEncrypt = (): string => {
//     switch (contentType) {
//       case 'text':
//         return textContent
//       case 'json':
//         return jsonContent
//       case 'file':
//         return selectedFile ? selectedFile.name : ''
//       default:
//         return textContent
//     }
//   }

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0] || null
//     setSelectedFile(file)
//   }

//   const handleUploadAndEncrypt = async () => {
//     setIsProcessing(true)
//     clearResults()

//     try {
//       const contentToEncrypt = getContentToEncrypt()
//       if (!contentToEncrypt) {
//         addResult('❌', 'No content to encrypt', false)
//         return
//       }

//       addResult('🔐', `Encrypting ${contentType} content...`)
//       addResult('📝', `Content ID: ${contentId}`)
//       addResult('💰', `Price: ${price} USDC`)

//       const result = await uploadAndEncrypt(contentToEncrypt, contentId, price)
      
//       setUploadedData({
//         cid: result.cid,
//         contentId: result.contentId,
//         originalContentId: result.originalContentId,
//         dataToEncryptHash: result.dataToEncryptHash,
//         originalContent: contentToEncrypt,
//         ciphertext: result.ciphertext,
//         contentType,
//         creator: userAddress,
//         price: result.priceInUSDC
//       })

//       addResult('✅', 'Content encrypted and uploaded successfully!')
//       addResult('🔗', `IPFS CID: ${result.cid}`)
//       addResult('💾', `Content ID: ${result.contentId}`)
//       addResult('💰', `Price: ${result.priceInUSDC} USDC`)

//       await fetchUserContent()
//     } catch (error) {
//       console.error('Upload and encrypt failed:', error)
//       addResult('❌', `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handlePayAndDecrypt = async () => {
//     if (!uploadedData) {
//       addResult('❌', 'No uploaded data to decrypt', false)
//       return
//     }

//     setIsProcessing(true)
//     clearResults()

//     try {
//       addResult('🔓', 'Decrypting content...')
//       addResult('📝', `Content ID: ${uploadedData.contentId}`)

//       const decryptedContent = await decryptContent(
//         uploadedData.ciphertext,
//         uploadedData.dataToEncryptHash,
//         uploadedData.contentId
//       )

//       addResult('✅', 'Content decrypted successfully!')
//       addResult('📄', `Decrypted content: ${decryptedContent.substring(0, 100)}${decryptedContent.length > 100 ? '...' : ''}`)
//     } catch (error) {
//       console.error('Decrypt failed:', error)
//       addResult('❌', `Decrypt failed: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleAutoDecrypt = async (contentId: string) => {
//     if (!userAddress) {
//       addResult('❌', 'No user address available', false)
//       return
//     }

//     setIsProcessing(true)
//     clearResults()

//     try {
//       addResult('🤖', `Auto-decrypting content: ${contentId}`)
//       addResult('👤', `User: ${userAddress}`)

//       const result = await autoDecryptContent(contentId, userAddress)
//       setAutoDecryptResults([result])

//       if (result.success) {
//         addResult('✅', 'Auto-decrypt successful!')
//         addResult('📄', `Decrypted content: ${result.decryptedContent?.substring(0, 100)}${result.decryptedContent && result.decryptedContent.length > 100 ? '...' : ''}`)
//       } else if (result.needsPayment) {
//         addResult('💰', `Payment required: ${result.price} USDC`)
//         addResult('💡', 'Click "Unlock" to pay for access')
//       } else {
//         addResult('❌', `Auto-decrypt failed: ${result.error}`, false)
//       }
//     } catch (error) {
//       console.error('Auto-decrypt failed:', error)
//       addResult('❌', `Auto-decrypt failed: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleFarcasterAutoDecrypt = async (contentId: string) => {
//     if (!isFarcasterApp || !farcasterUser?.address) {
//       addResult('❌', 'Not in Farcaster Mini App or no wallet available', false)
//       return
//     }

//     setIsProcessing(true)
//     clearResults()

//     try {
//       addResult('🎭', `Farcaster auto-decrypt: ${contentId}`)
//       addResult('👤', `User: ${farcasterUser.displayName || farcasterUser.username} (${farcasterUser.address})`)

//       const result = await accessContentWithFarcaster(contentId)
//       // Convert FarcasterContentResult to AutoDecryptResult
//       const autoDecryptResult: AutoDecryptResult = {
//         success: result.success,
//         hasAccess: result.hasAccess || false,
//         needsPayment: result.needsPayment,
//         price: result.price,
//         decryptedContent: result.decryptedContent,
//         error: result.error
//       }
//       setAutoDecryptResults([autoDecryptResult])

//       if (result.success) {
//         addResult('✅', 'Farcaster auto-decrypt successful!')
//         if (result.txHash) {
//           addResult('💸', `Payment TX: ${result.txHash}`)
//         }
//         addResult('📄', `Decrypted content: ${result.decryptedContent?.substring(0, 100)}${result.decryptedContent && result.decryptedContent.length > 100 ? '...' : ''}`)
//       } else if (result.needsPayment) {
//         addResult('💰', `Payment required: ${result.price} USDC`)
//         addResult('💡', 'Payment failed or was cancelled')
//       } else {
//         addResult('❌', `Farcaster auto-decrypt failed: ${result.error}`, false)
//       }
//     } catch (error) {
//       console.error('Farcaster auto-decrypt failed:', error)
//       addResult('❌', `Farcaster auto-decrypt failed: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleUnlockContent = async (content: UserContent) => {
//     setIsProcessing(true)
//     clearResults()

//     try {
//       addResult('💸', `Paying for content: ${content.title}`)
      
//       let payResult
//       if (isFarcasterApp && farcasterUser?.address) {
//         // Use Farcaster wallet
//         payResult = await payForContentWithFarcasterWallet(content.contentId)
//       } else {
//         // Use private key fallback
//         payResult = await payForContentWithUSDC(content.contentId,"")
//       }

//       if (payResult.success) {
//         addResult('✅', `Payment successful! Tx: ${payResult.txHash}`)
//         await fetchUserContent()
        
//         // Auto-decrypt after successful payment
//         addResult('🤖', 'Auto-decrypting after payment...')
//         const decryptResult = await autoDecryptContent(content.contentId, userAddress)
//         setAutoDecryptResults([decryptResult])
        
//         if (decryptResult.success) {
//           addResult('✅', 'Auto-decrypt successful after payment!')
//           addResult('📄', `Decrypted content: ${decryptResult.decryptedContent?.substring(0, 100)}${decryptResult.decryptedContent && decryptResult.decryptedContent.length > 100 ? '...' : ''}`)
//         }
//       } else {
//         addResult('❌', `Payment failed: ${(payResult as any).error || 'Unknown error'}`, false)
//       }
//     } catch (error) {
//       addResult('❌', `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleDecryptUserContent = async (content: UserContent) => {
//     setIsProcessing(true)
//     clearResults()

//     try {
//       addResult('🔓', `Decrypting user content: ${content.title}`)
//       addResult('📝', `Content ID: ${content.contentId}`)
//       addResult('💰', `Price: ${content.price} USDC`)

//       // Use auto-decrypt for user content
//       const result = await autoDecryptContent(content.contentId, userAddress)
//       setAutoDecryptResults([result])

//       if (result.success) {
//         addResult('✅', 'Content decrypted successfully!')
//         addResult('📄', `Decrypted content: ${result.decryptedContent?.substring(0, 100)}${result.decryptedContent && result.decryptedContent.length > 100 ? '...' : ''}`)
//       } else if (result.needsPayment) {
//         addResult('💰', `Payment required: ${result.price} USDC`)
//         addResult('💡', 'Click "Unlock" to pay for access')
//       } else {
//         addResult('❌', `Decrypt failed: ${result.error}`, false)
//       }

//     } catch (error) {
//       console.error('Decrypt user content failed:', error)
//       addResult('❌', `Decrypt failed: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleContentSelect = async (content: UserContent) => {
//     setSelectedUserContent(content)
    
//     // Automatically check access and decrypt if signer is available
//     if (currentSigner) {
//       setIsProcessing(true)
//       clearResults()
      
//       try {
//         addResult('🔍', `Auto-checking access for: ${content.title}`)
        
//         let result: AutoDecryptResult
        
//         if (isFarcasterApp) {
//           result = await autoCheckAndDecryptForFarcaster(content.contentId)
//         } else {
//           result = await autoCheckAndDecryptForSigner(content.contentId, currentSigner)
//         }
        
//         setAutoDecryptResults([result])
        
//         if (result.success) {
//           addResult('✅', 'Access granted! Content decrypted automatically.')
//           addResult('📄', `Decrypted content: ${result.decryptedContent?.substring(0, 100)}${result.decryptedContent && result.decryptedContent.length > 100 ? '...' : ''}`)
//         } else if (result.needsPayment) {
//           addResult('💰', `Payment required: ${result.price} USDC`)
//           addResult('💡', 'Click "Unlock" to pay for access')
//         } else {
//           addResult('❌', `Access check failed: ${result.error}`, false)
//         }
//       } catch (error) {
//         console.error('Auto-access check failed:', error)
//         addResult('❌', `Auto-access check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
//       } finally {
//         setIsProcessing(false)
//       }
//     }
//   }

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
//         <h1 className="text-3xl font-bold mb-2">🔐 Lit Protocol + Farcaster Wallet Test</h1>
//         <p className="text-blue-100">
//           Test encrypted content with USDC payments, platform fees, and auto-decrypt functionality
//         </p>
//         {isFarcasterApp && (
//           <div className="mt-4 p-3 bg-blue-500 rounded-lg">
//             <p className="font-semibold">🎉 Running in Farcaster Mini App!</p>
//             {farcasterUser && (
//               <div className="mt-2 text-sm">
//                 <p><strong>User:</strong> {farcasterUser.displayName || farcasterUser.username} (FID: {farcasterUser.fid})</p>
//                 <p><strong>Wallet:</strong> {farcasterUser.address}</p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Input Section */}
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Content Type
//             </label>
//             <select
//               value={contentType}
//               onChange={(e) => setContentType(e.target.value as ContentType)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               aria-label="Select content type"
//             >
//               <option value="text">Text</option>
//               <option value="json">JSON</option>
//               <option value="file">File</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Content ID
//             </label>
//             <input
//               type="text"
//               value={contentId}
//               onChange={(e) => setContentId(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="unique-content-id"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Price (USDC)
//             </label>
//             <input
//               type="text"
//               value={price}
//               onChange={(e) => setPrice(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="0.001"
//             />
//           </div>

//           {contentType === 'text' && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Text Content
//               </label>
//               <textarea
//                 value={textContent}
//                 onChange={(e) => setTextContent(e.target.value)}
//                 rows={4}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="Enter text to encrypt..."
//               />
//             </div>
//           )}

//           {contentType === 'json' && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 JSON Content
//               </label>
//               <textarea
//                 value={jsonContent}
//                 onChange={(e) => setJsonContent(e.target.value)}
//                 rows={6}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="Enter JSON to encrypt..."
//               />
//             </div>
//           )}

//           {contentType === 'file' && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 File Upload
//               </label>
//               <input
//                 type="file"
//                 onChange={handleFileChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               {selectedFile && (
//                 <p className="mt-2 text-sm text-gray-600">
//                   Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
//                 </p>
//               )}
//             </div>
//           )}

//           <button
//             onClick={handleUploadAndEncrypt}
//             disabled={isProcessing}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isProcessing ? 'Processing...' : '🔐 Upload & Encrypt'}
//           </button>

//           <div className="bg-gray-50 p-3 rounded-md">
//             <h3 className="font-semibold text-sm mb-2">📋 Contract Info</h3>
//             <p className="text-xs text-gray-600">
//               <strong>Network:</strong> {process.env.NEXT_PUBLIC_BASE_RPC_URL ? 'Base Mainnet' : 'Base Sepolia'}
//             </p>
//             <p className="text-xs text-gray-600">
//               <strong>Contract:</strong> {process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || '0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29'}
//             </p>
//             <p className="text-xs text-gray-600">
//               <strong>USDC:</strong> {process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'}
//             </p>
//             <p className="text-xs text-gray-600">
//               <strong>Platform Fee:</strong> 10%
//             </p>
//             <p className="text-sm text-gray-600">
//               <strong>User:</strong> {userAddress || 'Loading...'}
//             </p>
//             <div className="mt-2 p-2 rounded text-xs">
//               <p className={`font-semibold ${currentSigner ? 'text-green-600' : 'text-red-600'}`}>
//                 {currentSigner ? '✅ Signer Connected' : '❌ No Signer'}
//               </p>
//               <p className="text-gray-500">
//                 {currentSigner 
//                   ? 'Click content to auto-check access and decrypt' 
//                   : 'Connect wallet to enable auto-access checking'
//                 }
//               </p>
//             </div>
//           </div>

//           {/* Test Files Section */}
//           <div className="bg-yellow-50 p-3 rounded-md">
//             <h3 className="font-semibold text-sm mb-2">📁 Test Files</h3>
//             <div className="space-y-2">
//               <a
//                 href="/test-files/sample-text.txt"
//                 download
//                 className="block text-xs text-blue-600 hover:text-blue-800"
//               >
//                 📄 Download Sample Text
//               </a>
//               <a
//                 href="/test-files/sample-data.json"
//                 download
//                 className="block text-xs text-blue-600 hover:text-blue-800"
//               >
//                 📄 Download Sample JSON
//               </a>
//             </div>
//           </div>
//         </div>

//         {/* User Content Section */}
//         <div className="space-y-4">
//           <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//             <h3 className="text-lg font-semibold text-green-800 mb-2">📚 Your Uploaded Content</h3>
//             <button
//               onClick={fetchUserContent}
//               className="mb-3 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
//             >
//               Refresh
//             </button>
            
//             {userContent.length === 0 ? (
//               <p className="text-green-700">No content uploaded yet.</p>
//             ) : (
//               <div className="space-y-2 max-h-64 overflow-y-auto">
//                 {userContent.map((content, index) => (
//                   <div 
//                     key={index} 
//                     className={`bg-white p-3 rounded border cursor-pointer transition-colors ${
//                       selectedUserContent?.contentId === content.contentId 
//                         ? 'border-blue-500 bg-blue-50' 
//                         : 'hover:bg-gray-50'
//                     }`}
//                     onClick={() => handleContentSelect(content)}
//                   >
//                     <h4 className="font-medium text-sm">{content.title}</h4>
//                     <p className="text-xs text-gray-600 mb-2">{content.description}</p>
//                     <div className="text-xs text-gray-500 space-y-1">
//                       <p><strong>ID:</strong> {content.contentId.substring(0, 10)}...</p>
//                       <p><strong>Price:</strong> {content.price} USDC</p>
//                       <p><strong>Type:</strong> {content.contentType || 'text'}</p>
//                       <p><strong>Status:</strong> {content.hasAccess ? 'Unlocked' : 'Locked'}</p>
//                     </div>
//                     <div className="mt-2 space-x-2">
//                       {!content.hasAccess && (
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handleUnlockContent(content)
//                           }}
//                           className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
//                         >
//                           Unlock (Pay USDC)
//                         </button>
//                       )}
//                       <span className="text-xs text-gray-400">
//                         {content.hasAccess ? '✅ Click to decrypt' : '💰 Click to check access'}
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Results Section */}
//         <div className="space-y-4">
//           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold text-gray-800">📊 Results</h3>
//               <button
//                 onClick={clearResults}
//                 className="text-sm text-gray-600 hover:text-gray-800"
//               >
//                 Clear
//               </button>
//             </div>
            
//             <div className="space-y-2 max-h-96 overflow-y-auto">
//               {results.length === 0 ? (
//                 <p className="text-gray-500 text-sm">No results yet. Try uploading or decrypting content.</p>
//               ) : (
//                 results.map((result, index) => (
//                   <div
//                     key={index}
//                     className={`p-2 rounded text-sm ${
//                       result.isError ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
//                     }`}
//                   >
//                     <span className="mr-2">{result.icon}</span>
//                     {result.message}
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Auto-Decrypt Results */}
//           {autoDecryptResults.length > 0 && (
//             <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
//               <h3 className="text-lg font-semibold text-purple-800 mb-2">🤖 Auto-Decrypt Results</h3>
//               {autoDecryptResults.map((result, index) => (
//                 <div key={index} className="space-y-2">
//                   <div className={`p-2 rounded text-sm ${
//                     result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                   }`}>
//                     <p><strong>Status:</strong> {result.success ? 'Success' : 'Failed'}</p>
//                     <p><strong>Has Access:</strong> {result.hasAccess ? 'Yes' : 'No'}</p>
//                     {result.needsPayment && (
//                       <p><strong>Payment Required:</strong> {result.price} USDC</p>
//                     )}
//                     {result.error && (
//                       <p><strong>Error:</strong> {result.error}</p>
//                     )}
//                   </div>
//                   {result.decryptedContent && (
//                     <div className="bg-white p-2 rounded border">
//                       <p className="text-xs font-semibold mb-1">Decrypted Content:</p>
//                       <p className="text-xs break-all">{result.decryptedContent}</p>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}

//           {uploadedData && (
//             <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
//               <h3 className="text-lg font-semibold text-purple-800 mb-2">🔐 Uploaded Data</h3>
//               <div className="space-y-2 text-sm">
//                 <p><strong>IPFS CID:</strong> {uploadedData.cid}</p>
//                 <p><strong>Content ID:</strong> {uploadedData.contentId}</p>
//                 <p><strong>Price:</strong> {uploadedData.price} USDC</p>
//                 <p><strong>Type:</strong> {uploadedData.contentType}</p>
//               </div>
//               <div className="mt-3 space-y-2">
//                 <button
//                   onClick={handlePayAndDecrypt}
//                   disabled={isProcessing}
//                   className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isProcessing ? 'Processing...' : '🔓 Pay & Decrypt'}
//                 </button>
//                 <button
//                   onClick={() => {
//                     if (currentSigner) {
//                       // Auto-check access for uploaded content
//                       setIsProcessing(true)
//                       clearResults()
                      
//                       const checkAccess = async () => {
//                         try {
//                           addResult('🔍', `Auto-checking access for uploaded content`)
                          
//                           let result: AutoDecryptResult
                          
//                           if (isFarcasterApp) {
//                             result = await autoCheckAndDecryptForFarcaster(uploadedData.contentId)
//                           } else {
//                             result = await autoCheckAndDecryptForSigner(uploadedData.contentId, currentSigner)
//                           }
                          
//                           setAutoDecryptResults([result])
                          
//                           if (result.success) {
//                             addResult('✅', 'Access granted! Content decrypted automatically.')
//                             addResult('📄', `Decrypted content: ${result.decryptedContent?.substring(0, 100)}${result.decryptedContent && result.decryptedContent.length > 100 ? '...' : ''}`)
//                           } else if (result.needsPayment) {
//                             addResult('💰', `Payment required: ${result.price} USDC`)
//                             addResult('💡', 'Click "Pay & Decrypt" to purchase access')
//                           } else {
//                             addResult('❌', `Access check failed: ${result.error}`, false)
//                           }
//                         } catch (error) {
//                           console.error('Auto-access check failed:', error)
//                           addResult('❌', `Auto-access check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
//                         } finally {
//                           setIsProcessing(false)
//                         }
//                       }
                      
//                       checkAccess()
//                     }
//                   }}
//                   disabled={isProcessing || !currentSigner}
//                   className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isProcessing ? 'Processing...' : '🤖 Auto-Check Access'}
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }