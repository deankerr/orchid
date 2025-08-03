import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { AppLayout } from './app-layout'
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
            <AppLayout>{children}</AppLayout>
          </ConvexClientProvider>
        </NuqsAdapter>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
