import type { NextConfig } from 'next'

import bundleAnalyzer from '@next/bundle-analyzer'
import { withPostHogConfig } from '@posthog/nextjs-config'

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
      {
        source: '/models',
        destination: '/',
        permanent: false,
      },
      {
        source: '/models/:path*',
        destination: '/',
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
    ]
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(
  withPostHogConfig(nextConfig, {
    personalApiKey: process.env.POSTHOG_API_KEY!,
    envId: process.env.POSTHOG_ENV_ID!,
  }),
)
