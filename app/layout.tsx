import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import ModernNavbar from '@/components/layout/ModernNavbar'
import Footer from '@/components/layout/Footer'

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: "GigWay — India's Zero Commission Freelance & Jobs Platform",
  description: "Find freelancers, post projects, browse jobs and gigs — zero commission. India's first hybrid freelance + jobs platform. Hire top talent or find your dream gig today.",
  keywords: "freelance india, jobs india, hire freelancer, zero commission, freelancer platform india, internship india, gig work india",
  icons: {
    icon: '/favicon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: "GigWay — India's Zero Commission Platform",
    description: "Freelance gigs lo. Full-time jobs dhundho. Poori kamaai rakho.",
    type: "website",
    images: [{ url: '/logo.png', width: 400, height: 100, alt: 'GigWay' }],
  },
  manifest: '/manifest.json',
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
