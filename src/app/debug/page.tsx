import { ContentDebugger } from '../../components/ContentDebugger'
import { TestUpload } from '../../components/TestUpload'

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Content Debug Tool</h1>
      <p className="text-gray-600 mb-6">
        Use this tool to debug content issues and verify CID availability.
      </p>
      
      <div className="space-y-8">
        <TestUpload />
        <ContentDebugger />
      </div>
      
      <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold mb-2 text-yellow-800">Troubleshooting Tips</h3>
        <ul className="space-y-1 text-sm text-yellow-700">
          <li>• If CID format is invalid, check that it starts with Qm (v0) or b (v1)</li>
          <li>• If content is not in store, the upload may have failed</li>
          <li>• If IPFS is not available, there may be propagation delays or gateway issues</li>
          <li>• Check the browser console for detailed error messages during upload</li>
          <li>• Use the test upload tool above to debug without wallet connection</li>
        </ul>
      </div>
    </div>
  )
} 