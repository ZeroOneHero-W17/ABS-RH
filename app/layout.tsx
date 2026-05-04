import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Système de Demande d\'Absence RH',
  description: 'Plateforme pour les demandes d\'absence des employés',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a8a" />
        <link rel="icon" href="/ABS-logo.svg" />
        <link rel="apple-touch-icon" href="/ABS-logo.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}