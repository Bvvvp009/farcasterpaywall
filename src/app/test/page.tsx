import { TestUpload } from '../../components/TestUpload'

export default function TestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">🧪 Test Upload & Retrieve</h1>
      <p className="text-gray-600 mb-6">
        This page allows you to test content upload and retrieval functionality without requiring wallet connection or Farcaster deployment.
      </p>
      
      <TestUpload />
      
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">How to Use</h3>
        <ol className="space-y-2 text-sm text-blue-700">
          <li>1. Select a file (image or text file)</li>
          <li>2. Optionally modify the title and description</li>
          <li>3. Click "Upload Test Content" to upload to IPFS</li>
          <li>4. Use the generated CID to test retrieval</li>
          <li>5. Check the browser console for detailed logs</li>
        </ol>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-700">
          <strong>Note:</strong> This is a development-only page. Remove this component before deploying to production.
        </p>
      </div>
    </div>
  )
} 