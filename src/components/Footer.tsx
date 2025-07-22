export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-pink-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-sm">Powered by</span>
            <a 
              href="https://litprotocol.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <span className="text-lg">⚡</span>
              <span className="font-semibold text-sm">Lit Protocol</span>
            </a>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Made with ❤️ by bvvvp009
            </a>
            <a 
              href="https://github.com/bvvvp009" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              GitHub
            </a>
            <a 
              href="https://discord.gg/bvvvp009" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Discord
            </a>
            <a 
              href="https://farcaster.xyz/0xkarthik" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Farcaster Profile
            </a>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-pink-100 text-center">
          <p className="text-xs text-gray-500">
            Secure content access and monetization powered by Lit Protocol's decentralized encryption
          </p>
        </div>
      </div>
    </footer>
  )
} 