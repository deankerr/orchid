import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ConvexClientProvider } from './ConvexClientProvider'
import { Header } from '@/components/Header'

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="relative">{children}</main>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
