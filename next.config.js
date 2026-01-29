/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
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