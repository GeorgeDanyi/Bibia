/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Exclude pg-native from server components (not compatible with Vercel serverless or Edge runtime)
  serverComponentsExternalPackages: ['pg-native'],
  webpack: (config, { isServer }) => {
    // Exclude pg-native from all bundles (not compatible with Vercel serverless or Edge runtime)
    config.externals = config.externals || []
    if (Array.isArray(config.externals)) {
      config.externals.push('pg-native')
    } else {
      config.externals = [config.externals, 'pg-native']
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