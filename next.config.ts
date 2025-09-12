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
        destination: '/models',
        permanent: false,
      },
    ]
  },
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
