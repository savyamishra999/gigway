import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "GigWay — India's Zero Commission Freelance & Jobs Platform",
  description: "Find freelancers, post projects, browse jobs and gigs — zero commission. India's first hybrid freelance + jobs platform. Hire top talent or find your dream gig today.",
  keywords: "freelance india, jobs india, hire freelancer, zero commission, freelancer platform india, internship india, gig work india",
  openGraph: {
    title: "GigWay — India's Zero Commission Platform",
    description: "Freelance gigs lo. Full-time jobs dhundho. Poori kamaai rakho.",
    type: "website",
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
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
