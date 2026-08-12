import Link from "next/link"
import { Twitter, Linkedin, Instagram } from "lucide-react"

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/explore",  label: "Discover" },
      { href: "/jobs",     label: "Jobs" },
      { href: "/projects", label: "Projects" },
      { href: "/gigs",     label: "Gigs" },
      { href: "/pricing",  label: "Pricing" },
    ],
  },
  {
    title: "Professionals",
    links: [
      { href: "/profile/edit", label: "Create Profile" },
      { href: "/jobs",         label: "Find Work" },
      { href: "/profile/edit", label: "Showcase Work" },
    ],
  },
  {
    title: "Businesses",
    links: [
      { href: "/freelancers",     label: "Find Talent" },
      { href: "/jobs/new",        label: "Post a Job" },
      { href: "/organizations/new", label: "Create Organization" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms",   label: "Terms of Service" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-brand-midnight mt-12">
      <div className="container mx-auto px-4 py-14 max-w-7xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="text-h3 font-extrabold bg-gradient-to-r from-white to-brand-coral bg-clip-text text-transparent">
              GigWay
            </Link>
            <p className="text-slate-400 text-body-sm mt-3 leading-relaxed max-w-xs">
              Your work, your network, your next opportunity — 0% platform commission, always.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://twitter.com/gigway_in" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/25 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com/company/gigway-in" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/25 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://instagram.com/gigway.in" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/25 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map(col => (
            <div key={col.title}>
              <p className="text-white font-semibold text-body-sm mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-slate-400 hover:text-white text-body-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-caption text-center sm:text-left">
            © {new Date().getFullYear()} GigWay. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 text-caption font-medium">0% Platform Commission — Always</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
