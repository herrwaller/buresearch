import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brand University Research',
  description: 'Research platform of Brand University – transdisciplinary inquiry at the intersection of science, arts, and culture.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ backgroundColor: '#ffffff', colorScheme: 'light' }}>
      <body style={{ backgroundColor: '#ffffff', color: '#18171b' }}>{children}</body>
    </html>
  )
}
