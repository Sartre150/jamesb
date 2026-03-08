import './globals.css'
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Calculadora',
  description: 'App utilitaria',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Calc',
    statusBarStyle: 'black-translucent', // Esto hace que la barra de batería de arriba se mezcle con el fondo negro
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-black text-white">{children}</body>
    </html>
  )
}