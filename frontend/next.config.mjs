/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude problematic packages from server-side bundling
  // (thread-stream and pino contain test files that break Turbopack)
  serverExternalPackages: ['pino', 'thread-stream', 'pino-pretty'],
  // Empty turbopack config (required in Next.js 16 when using webpack config)
  turbopack: {},
  // Webpack fallback for problematic modules (used when building with webpack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      // Handle MetaMask SDK react-native dependency
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }
    // Handle pino-pretty warning
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };
    return config;
  },
}

export default nextConfig

