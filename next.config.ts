import type { NextConfig } from 'next'

import bundleAnalyzer from '@next/bundle-analyzer'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 't0.gstatic.com',
        pathname: '/faviconV2',
      },
    ],
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/endpoints',
        permanent: false,
      },
    ]
  },
  rewrites: async () => {
    return [
      {
        source: '/snarf/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/snarf/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/api/script.js',
        destination: `${process.env.NEXT_PUBLIC_RYBBIT_HOST}/api/script.js`,
      },
      {
        source: '/api/track',
        destination: `${process.env.NEXT_PUBLIC_RYBBIT_HOST}/api/track`,
      },
    ]
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
