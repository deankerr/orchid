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
  rewrites: async () => {
    return [
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
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
