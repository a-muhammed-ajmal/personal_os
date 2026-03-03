import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'LifeSync – Personal Productivity OS',
  description: 'Mobile-first personal productivity app: tasks, habits, projects, and notes — all in one place.',
  keywords: 'productivity, tasks, habits, projects, notes, personal OS',
  authors: [{ name: 'LifeSync' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'LifeSync' },
  openGraph: {
    title: 'LifeSync – Personal Productivity OS',
    description: 'Your all-in-one personal productivity system.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4F46E5',
}

export default function RootLayout ({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
