/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config, { isServer }) => {
    // Handle transformers package
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Handle binary files from transformers
    config.module.rules.push({
      test: /\.bin$/,
      type: 'asset/resource',
    });

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
}

module.exports = nextConfig
