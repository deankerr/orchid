import { Header } from './header'

export default function BulkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative">{children}</main>
    </div>
  )
}
