/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🟢 We have removed the custom headers entirely.
  // COOP/COEP (require-corp) often blocks camera hardware streams 
  // and CDN WASM files on Windows Chrome.
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  experimental: {
    // Keeps Three.js performance high for your AR overlays
    optimizePackageImports: ['three'],
  },
};

export default nextConfig;