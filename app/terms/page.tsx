import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service — GigWay",
  description: "Read the terms and conditions for using GigWay, India's zero commission freelance platform.",
}

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    body: `By creating an account or using GigWay (gigway.in), you agree to these Terms of Service. If you do not agree, do not use the platform. These terms apply to all users — freelancers, clients, and visitors.`,
  },
  {
    title: "Eligibility",
    body: `You must be at least 18 years old and legally capable of entering into contracts under Indian law to use GigWay. By registering, you confirm that the information you provide is accurate and that you are not prohibited from using our services.`,
  },
  {
    title: "User Accounts",
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately at support@gigway.in if you suspect unauthorised access. GigWay reserves the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: "Zero Commission Policy",
    body: `GigWay does not charge a commission on transactions between freelancers and clients. Revenue is generated solely through optional premium features (Boost listings, Verified Badge). The zero-commission policy applies to direct payments between users — GigWay is not a party to those transactions and does not process or hold funds on behalf of users.`,
  },
  {
    title: "Prohibited Conduct",
    body: `You agree not to: post false, misleading, or fraudulent listings; harass, abuse, or threaten other users; attempt to circumvent the platform by taking relationships off-platform to avoid future collaboration; scrape, reverse-engineer, or misuse GigWay's data; use the platform for any illegal purpose under Indian law; create multiple accounts to abuse free-tier features.`,
  },
  {
    title: "Content and Intellectual Property",
    body: `You retain ownership of content you post (portfolio samples, gig descriptions, proposals). By posting content, you grant GigWay a non-exclusive, royalty-free licence to display it on the platform. You are responsible for ensuring you have the right to post any content. GigWay's branding, code, and original content remain the intellectual property of Vjenix Futuristic Technologies.`,
  },
  {
    title: "Payments and Refunds",
    body: `Premium features (Boost, Verified Badge) are processed via Razorpay. Payments are subject to Razorpay's terms. GigWay's refund policy: Boost plans may be refunded within the first 30 days if the feature does not function as described — contact support@gigway.in. Verified Badge fees are non-refundable once the verification process has begun. Razorpay processing fees are non-refundable in all cases.`,
  },
  {
    title: "Dispute Resolution Between Users",
    body: `GigWay is a marketplace and is not responsible for disputes between freelancers and clients. We encourage users to resolve disputes directly and professionally. GigWay may, at its discretion, mediate disputes but is not obligated to do so. Any disputes arising from the use of this platform shall be governed by Indian law, with jurisdiction in the courts of Mumbai, Maharashtra.`,
  },
  {
    title: "Limitation of Liability",
    body: `GigWay is provided "as is." We do not guarantee uninterrupted service, and we are not liable for loss of income, data, or business opportunities arising from downtime or errors. Our total liability to any user for any claim shall not exceed the amount paid to GigWay by that user in the 3 months preceding the claim.`,
  },
  {
    title: "Termination",
    body: `You may delete your account at any time. GigWay may suspend or permanently terminate your account if you violate these terms, with or without prior notice. Upon termination, your right to use the platform ceases immediately. Sections on intellectual property, payments, and dispute resolution survive termination.`,
  },
  {
    title: "Changes to These Terms",
    body: `We may update these Terms of Service to reflect changes in law or platform features. We will notify you via email or in-app notice at least 7 days before material changes take effect. Continued use after the effective date constitutes acceptance.`,
  },
  {
    title: "Governing Law",
    body: `These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra. For consumer disputes, the applicable Consumer Protection Act provisions shall apply.`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[#4F46E5] text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Terms of Service</h1>
          <p className="text-[#94A3B8] text-sm">
            Last updated: <span className="text-white">January 1, 2026</span>
          </p>
          <p className="text-[#94A3B8] text-sm mt-3">
            These terms govern your use of GigWay, operated by{" "}
            <strong className="text-white">Vjenix Futuristic Technologies</strong>, India.
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
          <p className="text-[#94A3B8] text-sm">Questions about these terms?</p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-[#818CF8] text-sm font-medium hover:text-white transition-colors">
              Contact Us →
            </Link>
            <Link href="/privacy" className="text-[#818CF8] text-sm font-medium hover:text-white transition-colors">
              Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
