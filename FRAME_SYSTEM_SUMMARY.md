# Frame System Summary

## 🎯 **Overview**

The frame system has been completely redesigned to work properly within the Farcaster Mini App environment. When users click on frames, they now stay within the Mini App instead of being redirected to the website.

## 🔧 **Key Components**

### 1. **Content Storage System** (`src/lib/contentStorage.ts`)
- Stores content metadata for frame generation
- Handles multiple content ID formats (regular and bytes32)
- Provides proper lookup functions
- Generates frame metadata and share text

### 2. **Mini App Frame Handler** (`src/components/MiniAppFrameHandler.tsx`)
- Detects Mini App environment
- Handles frame actions within Mini App
- Manages payment flow using native Farcaster payments
- Provides content preview and access control
- Integrates with hybrid wallet system

### 3. **Smart Content Page** (`src/app/content/[cid]/page.tsx`)
- Automatically detects environment (Mini App vs Browser)
- Uses Mini App frame handler when in Mini App
- Falls back to regular content view in browser
- Ensures proper frame functionality in both environments

### 4. **Updated Frame API** (`src/app/api/frame/route.ts`)
- Uses new content storage system
- Generates proper frame metadata
- Handles frame button actions
- Supports both paid and free content

## 🚀 **How It Works**

### **Frame Creation Flow:**
1. **Content Creation**: User creates content via hybrid demo
2. **Storage**: Content metadata stored in `contentStorage`
3. **Frame Generation**: Frame metadata generated with proper URL
4. **Sharing**: User shares frame URL in Farcaster

### **Frame Interaction Flow:**
1. **Frame Click**: User clicks frame in Farcaster feed
2. **Environment Detection**: System detects Mini App environment
3. **Mini App Launch**: Opens within Mini App with splash screen
4. **Content Loading**: Loads content from storage
5. **Access Check**: Verifies user's payment status
6. **Action Handling**: Shows payment button or unlocked content

## 📱 **Mini App Experience**

### **When User Clicks Frame:**
```
┌─────────────────────────────────┐
│  📄 Content Title               │
│                                 │
│  Content description...         │
│                                 │
│  [Pay 0.1 USDC]                │
└─────────────────────────────────┘
```

**Clicks → Opens in Mini App:**

```
┌─────────────────────────────────┐
│  Farcaster Mini          [✕]   │
├─────────────────────────────────┤
│  📄 Content Title               │
│  Content description...         │
│                                 │
│  🔒 Premium Content             │
│  Pay 0.1 USDC to unlock         │
│                                 │
│  [Pay 0.1 USDC]                │
│  [📢 Share This Content]        │
│  [Close]                        │
└─────────────────────────────────┘
```

### **After Payment:**
```
┌─────────────────────────────────┐
│  Farcaster Mini          [✕]   │
├─────────────────────────────────┤
│  📄 Content Title               │
│  Content description...         │
│                                 │
│  ✅ Access Granted              │
│  You can now view this content  │
│                                 │
│  🎉 Content Unlocked!           │
│  Here's your exclusive content  │
│                                 │
│  [📢 Share This Content]        │
│  [Close]                        │
└─────────────────────────────────┘
```

## 🔄 **Environment Handling**

### **Mini App Environment:**
- Uses `MiniAppFrameHandler` component
- Integrates with Farcaster SDK
- Handles native payments
- Stays within Mini App context
- Provides Mini App-specific UI

### **Browser Environment:**
- Uses regular `ContentView` component
- Falls back to website experience
- Supports external wallet connections
- Provides full website functionality

## 💳 **Payment Integration**

### **Native Farcaster Payments:**
- Uses `sdk.actions.sendToken()` for payments
- Integrates with hybrid wallet system
- Handles USDC transfers
- Updates access status after payment

### **Payment Flow:**
1. User clicks "Pay X USDC" button
2. Farcaster native payment dialog opens
3. User confirms payment
4. Payment processed on-chain
5. Access granted immediately
6. Content unlocked for viewing

## 🧪 **Testing**

### **Test Pages:**
- `/test-frame` - Frame generation and metadata testing
- `/test-mini-app` - Mini App environment testing
- `/hybrid-demo` - Content creation and frame generation

### **Test Features:**
- Environment detection
- Content storage verification
- Frame metadata generation
- Share functionality testing
- Payment flow simulation

## 📊 **Frame Metadata Structure**

```json
{
  "version": "next",
  "imageUrl": "https://example.com/og-image.jpg",
  "button": {
    "title": "Pay 0.1 USDC",
    "action": {
      "type": "launch_frame",
      "url": "https://example.com/content/contentId",
      "name": "Farcaster Mini",
      "splashImageUrl": "https://example.com/splash.jpg",
      "splashBackgroundColor": "#f5f0ec"
    }
  }
}
```

## 🔗 **URL Structure**

### **Frame URLs:**
- Format: `https://example.com/content/{contentId}`
- Automatically detects environment
- Routes to appropriate handler
- Supports both Mini App and browser

### **Share URLs:**
- Format: `https://warpcast.com/~/compose?text={text}&embeds={frameUrl}`
- Pre-filled with content description
- Includes frame URL as embed
- Ready for immediate sharing

## 🎨 **UI/UX Features**

### **Mini App Design:**
- Mobile-optimized layout
- Consistent with Farcaster design
- Clear call-to-action buttons
- Loading states and error handling
- Smooth transitions

### **Content Display:**
- Rich content preview
- Payment status indicators
- Access control messaging
- Share functionality
- Close button integration

## 🔒 **Security & Access Control**

### **Access Verification:**
- On-chain payment verification
- User wallet integration
- Content access checking
- Secure payment processing

### **Data Protection:**
- Content metadata storage
- Secure payment handling
- User privacy protection
- Transaction verification

## 🚀 **Deployment**

### **Environment Variables:**
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASE_LIT_CONTRACT=0x...
NEXT_PUBLIC_USDC_CONTRACT_BASE=0x...
```

### **Frame Configuration:**
- Update `farcaster.json` with proper metadata
- Configure splash screen images
- Set up proper domain verification
- Test frame functionality

## 📈 **Benefits**

### **For Users:**
- Seamless Mini App experience
- Native payment integration
- No external redirects
- Consistent UI/UX
- Fast content access

### **For Creators:**
- Easy content monetization
- Built-in payment processing
- Frame sharing capabilities
- Access control management
- Analytics and tracking

### **For Platform:**
- Reduced friction
- Higher conversion rates
- Better user retention
- Native integration
- Scalable architecture

## 🔮 **Future Enhancements**

### **Planned Features:**
- Subscription-based content
- Advanced analytics
- Creator dashboard
- Multi-token support
- Enhanced frame interactions

### **Technical Improvements:**
- Database integration
- Caching optimization
- Performance monitoring
- Error tracking
- A/B testing support

---

## 🎯 **Quick Start**

1. **Create Content**: Use `/hybrid-demo` to create content
2. **Test Frames**: Use `/test-frame` to verify frame generation
3. **Test Mini App**: Use `/test-mini-app` to test Mini App functionality
4. **Share Frames**: Copy frame URLs and share in Farcaster
5. **Monitor**: Check frame interactions and payments

The frame system now provides a complete, native Mini App experience while maintaining compatibility with browser environments. 