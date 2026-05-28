import Link from "next/link"
import { Twitter, Linkedin, Instagram } from "lucide-react"

const PLATFORM_LINKS = [
  { href: "/gigs",        label: "Browse Gigs" },
  { href: "/jobs",        label: "Browse Jobs" },
  { href: "/projects",    label: "Projects" },
  { href: "/freelancers", label: "Find Freelancers" },
  { href: "/pricing",     label: "Pricing" },
]

const COMPANY_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms",   label: "Terms of Service" },
]

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0F] border-t border-[#1E1E2E] mt-12">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="text-2xl font-black bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">
              GigWAY
            </Link>
            <p className="text-[#6B7280] text-sm mt-3 leading-relaxed max-w-xs">
              India&apos;s zero commission freelance platform. Keep 100% of what you earn.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://twitter.com/gigway_in" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-[#1E1E2E] flex items-center justify-center text-[#6B7280] hover:text-white hover:border-[#334155] transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com/company/gigway-in" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-[#1E1E2E] flex items-center justify-center text-[#6B7280] hover:text-white hover:border-[#334155] transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://instagram.com/gigway.in" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-[#1E1E2E] flex items-center justify-center text-[#6B7280] hover:text-white hover:border-[#334155] transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Platform</p>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map(link => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-[#6B7280] hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Company</p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map(link => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-[#6B7280] hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <p className="text-[#6B7280] text-xs">Email us</p>
              <a href="mailto:support@gigway.in"
                className="text-[#818CF8] text-sm hover:text-white transition-colors">
                support@gigway.in
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1E1E2E] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#475569] text-xs text-center sm:text-left">
            © {new Date().getFullYear()} GigWay — Vjenix Futuristic Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            <span className="text-[#4ADE80] text-xs font-medium">0% Commission — Always</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
