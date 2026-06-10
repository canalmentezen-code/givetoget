/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Allow images from OAuth providers
  images: {
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "lh3.googleusercontent.com" },
    ],
  },

  // Mark firebase-admin and related packages as server-only externals
  // so they are never bundled into client or edge bundles
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "google-auth-library",
    "gaxios",
    "node-fetch",
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent node-only modules from being bundled in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
