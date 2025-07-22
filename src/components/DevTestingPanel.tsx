'use client'

import React, { useState, useEffect } from 'react'
import { mockFarcasterUser, mockWalletStatus, mockContentData, mockPaymentResult, enableMockMode } from '../lib/mockFarcasterData'

interface DevTestingPanelProps {
  onMockDataChange?: (type: string, data: any) => void
}

export default function DevTestingPanel({ onMockDataChange }: DevTestingPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'user' | 'wallet' | 'content' | 'payment'>('user')
  const [mockEnabled, setMockEnabled] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setMockEnabled(true)
    }
  }, [])

  if (!mockEnabled) {
    return null
  }

  const handleMockDataUpdate = (type: string, data: any) => {
    onMockDataChange?.(type, data)
    console.log(`🧪 Mock data updated for ${type}:`, data)
  }

  const renderUserTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mock User Data</h3>
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium">FID</label>
          <input
            type="number"
            defaultValue={mockFarcasterUser.fid}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('user', { ...mockFarcasterUser, fid: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            type="text"
            defaultValue={mockFarcasterUser.username}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('user', { ...mockFarcasterUser, username: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Display Name</label>
          <input
            type="text"
            defaultValue={mockFarcasterUser.displayName}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('user', { ...mockFarcasterUser, displayName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input
            type="text"
            defaultValue={mockFarcasterUser.address}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('user', { ...mockFarcasterUser, address: e.target.value })}
          />
        </div>
      </div>
    </div>
  )

  const renderWalletTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mock Wallet Status</h3>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            defaultChecked={mockWalletStatus.isConnected}
            onChange={(e) => handleMockDataUpdate('wallet', { ...mockWalletStatus, isConnected: e.target.checked })}
          />
          <label className="text-sm">Connected</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            defaultChecked={mockWalletStatus.isMiniApp}
            onChange={(e) => handleMockDataUpdate('wallet', { ...mockWalletStatus, isMiniApp: e.target.checked })}
          />
          <label className="text-sm">Mini App Environment</label>
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input
            type="text"
            defaultValue={mockWalletStatus.address}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('wallet', { ...mockWalletStatus, address: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Chain ID</label>
          <input
            type="number"
            defaultValue={mockWalletStatus.chainId}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('wallet', { ...mockWalletStatus, chainId: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )

  const renderContentTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mock Content Data</h3>
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium">Content ID</label>
          <input
            type="text"
            defaultValue={mockContentData.contentId}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('content', { ...mockContentData, contentId: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            defaultValue={mockContentData.title}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('content', { ...mockContentData, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Price (USDC)</label>
          <input
            type="text"
            defaultValue={mockContentData.price}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('content', { ...mockContentData, price: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Content Type</label>
          <select
            defaultValue={mockContentData.contentType}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('content', { ...mockContentData, contentType: e.target.value })}
          >
            <option value="text">Text</option>
            <option value="article">Article</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderPaymentTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mock Payment Result</h3>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            defaultChecked={mockPaymentResult.success}
            onChange={(e) => handleMockDataUpdate('payment', { ...mockPaymentResult, success: e.target.checked })}
          />
          <label className="text-sm">Payment Success</label>
        </div>
        <div>
          <label className="block text-sm font-medium">Transaction Hash</label>
          <input
            type="text"
            defaultValue={mockPaymentResult.txHash}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('payment', { ...mockPaymentResult, txHash: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Amount (USDC)</label>
          <input
            type="text"
            defaultValue={mockPaymentResult.amount}
            className="w-full px-3 py-2 border rounded"
            onChange={(e) => handleMockDataUpdate('payment', { ...mockPaymentResult, amount: e.target.value })}
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 z-50"
        title="Development Testing Panel"
      >
        🧪
      </button>

      {/* Testing Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          <div className="bg-purple-600 text-white p-3">
            <h2 className="text-lg font-semibold">🧪 Dev Testing Panel</h2>
            <p className="text-sm opacity-90">Farcaster Mini App Mock Data</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {(['user', 'wallet', 'content', 'payment'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 overflow-y-auto max-h-64">
            {activeTab === 'user' && renderUserTab()}
            {activeTab === 'wallet' && renderWalletTab()}
            {activeTab === 'content' && renderContentTab()}
            {activeTab === 'payment' && renderPaymentTab()}
          </div>

          {/* Actions */}
          <div className="p-3 bg-gray-50 border-t">
            <button
              onClick={() => {
                console.log('🧪 All mock data:', {
                  user: mockFarcasterUser,
                  wallet: mockWalletStatus,
                  content: mockContentData,
                  payment: mockPaymentResult
                })
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
            >
              Log All Mock Data
            </button>
          </div>
        </div>
      )}
    </>
  )
} 