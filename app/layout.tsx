import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'

import { SpeedInsights } from '@vercel/speed-insights/next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { App } from '@/components/app-layout/app'

import { ConvexClientProvider } from './convex-client-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ORCHID',
  description: 'ORCHID: OpenRouter Capability & Health Intelligence Dashboard',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} dark font-sans antialiased`}>
        <NuqsAdapter>
          <ConvexClientProvider>
            <App>{children}</App>
          </ConvexClientProvider>
        </NuqsAdapter>
        <SpeedInsights />
        <Script src="/api/script.js" data-site-id="2429" strategy="afterInteractive" />
      </body>
    </html>
  )
}
