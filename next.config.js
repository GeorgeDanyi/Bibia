/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude pg-native from server-side bundle (not compatible with Vercel serverless)
      config.externals = config.externals || []
      config.externals.push({
        'pg-native': 'commonjs pg-native',
      })
    }
    return config
  },
  async redirects() {
    return [
      {
        source: '/questionnaire/results',
        destination: '/results',
        permanent: true,
      },
      {
        source: '/questionnare',
        destination: '/questionnaire',
        permanent: true,
      },
      {
        source: '/questioonaire/result',
        destination: '/results',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig