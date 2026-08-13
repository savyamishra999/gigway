import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import ModernNavbar from '@/components/layout/ModernNavbar'
import Footer from '@/components/layout/Footer'

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope' })

// Icons are resolved via the App Router file convention (app/icon.png,
// app/apple-icon.png, app/favicon.ico) — deliberately not duplicated here via
// metadata.icons, since having both point to different assets is what caused
// the browser tab to show a stale/default icon.
export const metadata: Metadata = {
  metadataBase: new URL('https://www.gigway.in'),
  title: 'GigWay — Your Work. Your Network. Your Next Opportunity.',
  description: 'The Professional Platform for Work, Talent & Opportunity.',
  keywords: "freelance india, jobs india, hire freelancer, zero commission, freelancer platform india, internship india, gig work india",
  openGraph: {
    title: 'GigWay — Your Work. Your Network. Your Next Opportunity.',
    description: 'The Professional Platform for Work, Talent & Opportunity.',
    type: "website",
    images: [{ url: '/logo.png', width: 400, height: 133, alt: 'GigWay' }],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#4F46E5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7632015928190157"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${manrope.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ModernNavbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
