'use client'

import { useState } from 'react'

export function ContentDebugger() {
  const [cid, setCid] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDebug = async () => {
    if (!cid.trim()) {
      setError('Please enter a CID')
      return
    }

    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      const response = await fetch(`/api/debug/content/${cid.trim()}`)
      const data = await response.json()
      
      if (data.success) {
        setDebugInfo(data)
      } else {
        setError(data.error || 'Debug failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to debug content')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Content Debugger</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="cid" className="block text-sm font-medium text-gray-700 mb-1">
            CID to Debug
          </label>
          <input
            id="cid"
            type="text"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            placeholder="Enter CID (e.g., Qmdo94oFpkNDUAUZaEaUu1z6SrFewwdeQrfrWqV3CjFPHc)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleDebug}
          disabled={isLoading || !cid.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Debugging...' : 'Debug Content'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Debug Results</h4>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium mb-2">Status Checks</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>CID Format Valid:</span>
                  <span className={debugInfo.debug.isValid ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.debug.isValid ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>In Local Store:</span>
                  <span className={debugInfo.debug.inStore ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.debug.inStore ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Available on IPFS:</span>
                  <span className={debugInfo.debug.ipfsAvailable ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.debug.ipfsAvailable ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium mb-2">Details</h5>
              <div className="space-y-1 text-sm">
                <div><strong>CID:</strong> {debugInfo.debug.cid}</div>
                <div><strong>Store Key:</strong> {debugInfo.debug.storeKey}</div>
                <div><strong>Store Size:</strong> {debugInfo.debug.storeSize} items</div>
                {debugInfo.debug.availableKeys.length > 0 && (
                  <div>
                    <strong>Available Keys:</strong>
                    <ul className="ml-4 mt-1">
                      {debugInfo.debug.availableKeys.map((key: string) => (
                        <li key={key} className="font-mono text-xs">{key}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-medium mb-2 text-blue-800">Recommendations</h5>
              <ul className="space-y-1 text-sm text-blue-700">
                {debugInfo.recommendations.map((rec: string, index: number) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 