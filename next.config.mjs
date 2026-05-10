/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow MediaPipe WASM binaries and cross-origin camera
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },

  // Webpack: treat MediaPipe WASM as asset
  webpack(config) {
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    return config;
  },

  // Images: allow Supabase storage domain for GIF assets
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Experimental: needed for Three.js tree-shaking
  experimental: {
    optimizePackageImports: ['three'],
  },
};

export default nextConfig;