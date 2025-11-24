/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Required for static export compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Never bundle undici into client - it's Node.js only
      // Firebase will use browser's native fetch instead
      config.resolve.alias = {
        ...config.resolve.alias,
        'undici': false,
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Ignore pino-pretty since it's optional
    config.externals = config.externals || [];
    config.externals.push('pino-pretty');
    return config;
  },
}

module.exports = nextConfig
