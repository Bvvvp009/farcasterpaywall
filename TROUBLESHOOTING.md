# Content Upload Troubleshooting Guide

## Common Issues and Solutions

### 1. "Content not available after upload. Please try again."

This error occurs when the content upload process completes but the content cannot be verified as available.

**Possible Causes:**
- IPFS propagation delay
- Invalid CID format
- Content not properly stored in local database
- Network connectivity issues

**Solutions:**
1. **Check CID Format**: Ensure the CID starts with `Qm` (v0) or `b` (v1) and has the correct length
2. **Verify IPFS Upload**: Use the debug tool at `/debug` to check if content is available on IPFS
3. **Check Environment Variables**: Ensure `NEXT_PUBLIC_PINATA_API_KEY` and `NEXT_PUBLIC_PINATA_API_SECRET` are set
4. **Retry Upload**: Sometimes IPFS propagation takes a few seconds, try uploading again

### 2. "Invalid CID received from IPFS upload"

This error indicates that the IPFS service returned an invalid CID.

**Possible Causes:**
- IPFS service issues
- File corruption during upload
- Network connectivity problems

**Solutions:**
1. **Check IPFS Service**: Verify that Pinata or your IPFS service is operational
2. **Check File Size**: Ensure the file is not too large for your IPFS service
3. **Retry Upload**: Try uploading the same file again
4. **Check Network**: Ensure stable internet connection

### 3. "IPFS configuration error"

This error occurs when IPFS credentials are missing or invalid.

**Solutions:**
1. **Set Environment Variables**: Add to your `.env.local` file:
   ```
   NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
   NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret_key
   ```
2. **Verify Credentials**: Ensure your Pinata API credentials are valid
3. **Restart Development Server**: After setting environment variables, restart your dev server

### 4. "Content not found" (404 error)

This error occurs when trying to access content that doesn't exist.

**Possible Causes:**
- Content was never uploaded
- Content was uploaded but not stored in database
- Wrong CID being used

**Solutions:**
1. **Use Debug Tool**: Visit `/debug` and enter the CID to check its status
2. **Check Upload Logs**: Look at browser console for upload success messages
3. **Verify CID**: Ensure you're using the correct CID from the upload response

## Debug Tools

### Content Debugger
Visit `/debug` to use the interactive debug tool that can:
- Validate CID format
- Check if content exists in local store
- Verify IPFS availability
- Provide specific recommendations

### API Debug Endpoint
Use `/api/debug/content/{cid}` to get detailed debug information programmatically.

### Console Logging
The upload process now includes detailed console logging. Check the browser console for:
- Upload progress messages
- CID validation results
- IPFS availability checks
- Error details

## Environment Variables

Required environment variables:
```bash
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret_key
NEXT_PUBLIC_APP_URL=your_app_url
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
```

## Testing

To test the upload process:
1. Ensure all environment variables are set
2. Try uploading a small text file first
3. Check the debug tool to verify the upload
4. Monitor browser console for detailed logs

## Getting Help

If you continue to experience issues:
1. Check the browser console for detailed error messages
2. Use the debug tool at `/debug`
3. Verify your IPFS service credentials
4. Check network connectivity
5. Try uploading a different file to isolate the issue 