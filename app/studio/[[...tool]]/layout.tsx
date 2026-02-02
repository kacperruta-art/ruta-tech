import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Login | RUTA TECH immo',
  description: 'Admin portal login for RUTA TECH immo facility management system.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
