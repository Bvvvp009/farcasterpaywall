#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🧹 Removing test components for production...')

// Files to remove
const filesToRemove = [
  'src/components/TestUpload.tsx',
  'src/app/test/page.tsx',
  'scripts/remove-test-components.js',
  'src/lib/encryption-secure.test.ts',
  'src/lib/ipfs-test.ts',
  'src/lib/encryption.test.ts',
  
]

// Remove files
filesToRemove.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`✅ Removed: ${file}`)
  } else {
    console.log(`⚠️  File not found: ${file}`)
  }
})

// Update debug page to remove TestUpload import
const debugPagePath = path.join(process.cwd(), 'src/app/debug/page.tsx')
if (fs.existsSync(debugPagePath)) {
  let content = fs.readFileSync(debugPagePath, 'utf8')
  
  // Remove TestUpload import
  content = content.replace(/import { TestUpload } from '\.\.\/\.\.\/components\/TestUpload'\n/g, '')
  
  // Remove TestUpload component usage
  content = content.replace(/<TestUpload \/>\n        /g, '')
  
  // Update the space-y-8 div
  content = content.replace(/<div className="space-y-8">\n        <TestUpload \/>\n        <ContentDebugger \/>\n      <\/div>/g, '<ContentDebugger />')
  
  fs.writeFileSync(debugPagePath, content)
  console.log('✅ Updated debug page to remove TestUpload component')
}

console.log('🎉 Test components removed successfully!')
console.log('📝 Remember to also:')
console.log('   - Remove any test-related environment variables')
console.log('   - Update any documentation that references test components')
console.log('   - Test the application thoroughly before deployment') 