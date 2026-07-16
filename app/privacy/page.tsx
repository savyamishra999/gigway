import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — GigWay",
  description: "How GigWay collects, uses, and protects your personal information.",
}

const SECTIONS = [
  {
    title: "Information We Collect",
    body: `When you create a GigWay account, we collect your name, email address, and profile information you choose to share (skills, bio, portfolio links, phone number). When you make a payment, transaction details are processed by Razorpay — we store only the plan type and status, never your card details. We automatically collect basic usage data (pages visited, device type) to improve the platform.`,
  },
  {
    title: "How We Use Your Information",
    body: `Your information is used to operate your account, match you with relevant gigs and jobs, send you important notifications (new messages, application updates), and process payments. We do not sell your personal data to third parties. We may use aggregated, anonymised statistics to understand platform trends.`,
  },
  {
    title: "Data Sharing",
    body: `Your public profile (name, skills, bio, rating) is visible to other users browsing the platform. Your contact details (email, phone) are shared with another party only when you explicitly initiate a connection or accept a project. We share data with service providers (Supabase for database, Razorpay for payments, Vercel for hosting) solely to operate GigWay — they are bound by their own privacy policies.`,
  },
  {
    title: "Cookies and Local Storage",
    body: `We use browser localStorage to remember UI preferences (such as dismissed banners) and to keep you logged in. We do not use third-party advertising cookies. You can clear localStorage at any time through your browser settings — this will log you out.`,
  },
  {
    title: "Data Retention",
    body: `Your account data is retained as long as your account is active. If you delete your account, your personal data is removed within 30 days, except where we are required to retain records for legal or financial compliance (e.g., payment records for 7 years as per Indian tax law).`,
  },
  {
    title: "Your Rights",
    body: `You have the right to access the personal data we hold about you, correct inaccurate information, request deletion of your account and data, and opt out of non-essential communications. To exercise any of these rights, email us at business@vjenix.com.`,
  },
  {
    title: "Security",
    body: `We use industry-standard security measures including HTTPS encryption, Row Level Security in our database, and access controls. No system is 100% secure — if you believe your account has been compromised, contact us immediately.`,
  },
  {
    title: "Children's Privacy",
    body: `GigWay is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If we become aware that a minor has created an account, we will delete it promptly.`,
  },
  {
    title: "Changes to This Policy",
    body: `We may update this Privacy Policy occasionally. When we do, we will notify you via email or an in-app notification. Continued use of GigWay after changes take effect constitutes acceptance of the revised policy.`,
  },
  {
    title: "Contact Us",
    body: `For any privacy-related questions or requests, contact us at business@vjenix.com or through our Contact page. We aim to respond within 5 business days.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[#4F46E5] text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-[#94A3B8] text-sm">
            Last updated: <span className="text-white">January 1, 2026</span>
          </p>
          <p className="text-[#94A3B8] text-sm mt-3">
            GigWay is operated by <strong className="text-white">Vjenix Futuristic Technologies</strong>, registered in India.
            This policy explains how we handle your data when you use gigway.in.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section, i) => (
            <div key={i} className="border-b border-[#1E1E2E] pb-8 last:border-0">
              <h2 className="text-white font-bold text-lg mb-3">
                {i + 1}. {section.title}
              </h2>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-12 p-5 bg-[#12121A] border border-[#1E1E2E] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[#94A3B8] text-sm">Questions about this policy?</p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-[#818CF8] text-sm font-medium hover:text-white transition-colors">
              Contact Us →
            </Link>
            <Link href="/terms" className="text-[#818CF8] text-sm font-medium hover:text-white transition-colors">
              Terms of Service →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
