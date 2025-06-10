'use client'

import { useState } from 'react'
import { runPaidContentDemo, PaidContentDemo } from '../../lib/paid-content-demo'

export default function TestPaidContentPage() {
  const [demoOutput, setDemoOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addOutput = (message: string) => {
    setDemoOutput(prev => [...prev, message])
  }

  const runDemo = async () => {
    setIsRunning(true)
    setDemoOutput([])
    
    // Capture console.log output
    const originalLog = console.log
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      addOutput(message)
      originalLog(...args)
    }

    try {
      await runPaidContentDemo()
    } catch (error) {
      addOutput(`Error: ${error}`)
    } finally {
      console.log = originalLog
      setIsRunning(false)
    }
  }

  const clearOutput = () => {
    setDemoOutput([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Paid Content System Test
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This page demonstrates the complete paid content system including:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Content encryption and decryption</li>
              <li>Payment verification</li>
              <li>Access control</li>
              <li>Security testing</li>
              <li>Multi-user scenarios</li>
            </ul>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={runDemo}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isRunning ? 'Running Demo...' : '🚀 Run Complete Demo'}
            </button>
            
            <button
              onClick={clearOutput}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Clear Output
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
            {demoOutput.length === 0 ? (
              <div className="text-gray-500">
                Click "Run Complete Demo" to see the paid content system in action...
              </div>
            ) : (
              demoOutput.map((line, index) => (
                <div key={index} className="mb-1">
                  {line}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How It Works:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
              <li><strong>Upload:</strong> Content is encrypted with a unique key</li>
              <li><strong>Payment:</strong> User pays and payment is recorded</li>
              <li><strong>Access:</strong> System verifies payment status</li>
              <li><strong>Decrypt:</strong> Content is decrypted for authorized users</li>
              <li><strong>Security:</strong> Unauthorized access attempts are blocked</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Security Features:</h3>
            <ul className="list-disc list-inside text-yellow-800 space-y-1 text-sm">
              <li>Multi-layer encryption (content + key encryption)</li>
              <li>Payment proof verification</li>
              <li>User address validation</li>
              <li>Cryptographic signature verification</li>
              <li>Replay attack protection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 