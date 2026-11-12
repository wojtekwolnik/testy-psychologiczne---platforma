import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Real Moment – Przestrzeń Diagnostyczna',
  description: 'Przestrzeń Rozwojowa i Diagnostyczna Real Moment',
  icons: {
    icon: '/favicon-realmoment.png',
    shortcut: '/favicon-realmoment.png',
    apple: '/favicon-realmoment.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
