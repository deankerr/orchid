import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { ThemeProvider } from '@/app/theme-provider'
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <NuqsAdapter>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AppLayout>{children}</AppLayout>
            </ThemeProvider>
          </ConvexClientProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
