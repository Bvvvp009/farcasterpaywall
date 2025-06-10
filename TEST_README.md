# Test Upload & Retrieve Functionality

This document describes the test components added for debugging content upload and retrieval issues, including encryption/decryption testing.

## Test Pages

### 1. `/test` - Dedicated Test Page
- **URL**: `http://localhost:3000/test`
- **Purpose**: Standalone test page for upload/retrieve functionality with encryption support
- **Features**: 
  - Upload files to IPFS without wallet connection
  - Test encryption and decryption flow
  - Retrieve content by CID
  - Decrypt encrypted content
  - Detailed console logging
  - Auto-fill CID for testing

### 2. `/debug` - Debug Tools Page
- **URL**: `http://localhost:3000/debug`
- **Purpose**: Comprehensive debugging tools
- **Features**:
  - Test upload component with encryption
  - CID validation and debugging
  - Content availability checks
  - Troubleshooting recommendations

## How to Use Test Upload

1. **Navigate to test page**: Go to `http://localhost:3000/test`

2. **Upload Content**:
   - Select a file (image or text file)
   - Optionally modify title and description
   - Set test user address (for encryption key management)
   - Check "Encrypt content" to test encryption flow
   - Click "Upload Test Content"
   - Watch console for detailed logs

3. **Test Retrieval**:
   - Use the generated CID from upload
   - Or enter any CID manually
   - Click "Retrieve Content"
   - Check results and console logs

4. **Test Decryption** (if content is encrypted):
   - After retrieving encrypted content, click "Decrypt Content"
   - Verify the decrypted content matches the original

## Encryption Testing

The test component now supports full encryption/decryption testing:

### Encryption Flow:
1. **Content Encryption**: Original content is encrypted using AES-GCM
2. **Key Generation**: A random encryption key is generated
3. **Key Encryption**: The encryption key is "encrypted" for the user (placeholder implementation)
4. **IPFS Upload**: A placeholder file is uploaded to IPFS
5. **Metadata Storage**: Encrypted content and encrypted key are stored in metadata

### Decryption Flow:
1. **Content Retrieval**: Encrypted content and key are retrieved
2. **Key Decryption**: The encryption key is "decrypted" for the user
3. **Content Decryption**: The original content is decrypted using the key
4. **Verification**: Decrypted content should match the original

## Console Logging

The test component provides detailed console logging:

```
=== TEST UPLOAD START ===
File: test-image.jpg Size: 12345 Type: image/jpeg
Encrypted: true
Test User Address: 0xTestUser123456789
Encrypting content...
Generated encryption key: [base64-key]
Content encrypted successfully
Key encrypted for user
Created placeholder file for IPFS
Uploading content to IPFS...
Content uploaded: { contentCid: "Qm...", contentUrl: "https://..." }
Uploading metadata to IPFS...
Metadata uploaded: { metadataCid: "Qm...", metadataUrl: "https://..." }
Storing in local database...
Content stored successfully
Verifying content availability...
Content availability confirmed
=== TEST UPLOAD COMPLETE ===
```

### Decryption Logs:
```
=== TEST DECRYPT START ===
Decrypting content for user: 0xTestUser123456789
Key decrypted for user
Content decrypted successfully
Decrypted content: [original content]
=== TEST DECRYPT COMPLETE ===
```

## Debugging Common Issues

### 1. IPFS Upload Fails
- Check environment variables: `NEXT_PUBLIC_PINATA_API_KEY` and `NEXT_PUBLIC_PINATA_API_SECRET`
- Verify Pinata service is operational
- Check network connectivity

### 2. Content Not Found After Upload
- Use the debug tool at `/debug` to check CID status
- Verify content is stored in local database
- Check IPFS availability

### 3. Invalid CID Format
- CIDs should start with `Qm` (v0) or `b` (v1)
- Check length: v0 CIDs are 46 characters, v1 CIDs are 60 characters

### 4. Encryption/Decryption Issues
- Verify the test user address is consistent between upload and decrypt
- Check that encrypted content and key are properly stored in metadata
- Ensure the encryption library is working correctly

## Environment Variables Required

```bash
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
```

## Removing Test Components for Production

When ready to deploy to production:

```bash
npm run remove-test
```

This will:
- Remove `src/components/TestUpload.tsx`
- Remove `src/app/test/page.tsx`
- Remove the test component from the debug page
- Remove the cleanup script itself

## Testing Checklist

Before deploying to production:

- [ ] Test upload with different file types (images, text, etc.)
- [ ] Test retrieval with valid and invalid CIDs
- [ ] Test encryption and decryption flow
- [ ] Verify IPFS availability checks work
- [ ] Test error handling for missing environment variables
- [ ] Test encryption with different user addresses
- [ ] Verify decrypted content matches original
- [ ] Run `npm run remove-test` to clean up test components
- [ ] Verify the main app still works without test components

## Troubleshooting

If you encounter issues:

1. **Check browser console** for detailed error messages
2. **Use the debug tool** at `/debug` to validate CIDs
3. **Verify environment variables** are set correctly
4. **Test with a simple text file** first
5. **Check network connectivity** to IPFS services
6. **Verify encryption/decryption** with consistent user addresses

## Notes

- This is for development/testing only
- Test components should be removed before production deployment
- The test upload uses a dummy creator address (`0xTestUser123456789`)
- All content is marked as "free" for testing purposes
- Encryption key management is simplified for testing (real implementation would use proper public/private key encryption)
- The encryption flow simulates the real application's encryption process 