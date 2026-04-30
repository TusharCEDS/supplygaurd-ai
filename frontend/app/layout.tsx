import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SupplyGuard AI',
  description: 'AI-powered supply chain risk intelligence',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Space Grotesk', sans-serif", background: '#080c14', color: '#e2e8f0', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}