import { Metadata } from "next"
import { MessageCircle, Mail, Clock, Shield } from "lucide-react"
import ContactForm from "@/components/contact/ContactForm"

export const metadata: Metadata = {
  title: "Contact GigWay — Support",
  description: "Get help from the GigWay team. We reply within 24 hours via WhatsApp or email.",
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-[#818CF8] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            <Clock className="h-3.5 w-3.5" /> Usually reply within 24 hours
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            We&apos;re here to help
          </h1>
          <p className="text-[#94A3B8] text-sm max-w-sm mx-auto">
            Reach us on WhatsApp for fastest response, or send an email — we read everything.
          </p>
        </div>

        {/* Quick contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi GigWay! I need help with my account.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-[#1E293B] hover:bg-[#1E293B]/80 border border-[#334155] hover:border-[#25D366]/40 rounded-2xl px-5 py-4 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/20 transition-colors">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">WhatsApp</p>
              <p className="text-[#94A3B8] text-xs mt-0.5">Chat on WhatsApp →</p>
            </div>
          </a>

          <a
            href="mailto:support@gigway.in"
            className="flex items-center gap-4 bg-[#1E293B] hover:bg-[#1E293B]/80 border border-[#334155] hover:border-[#4F46E5]/40 rounded-2xl px-5 py-4 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#4F46E5]/20 transition-colors">
              <Mail className="h-5 w-5 text-[#818CF8]" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">Email</p>
              <p className="text-[#94A3B8] text-xs mt-0.5 truncate">support@gigway.in</p>
            </div>
          </a>
        </div>

        {/* Form card */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-4 w-4 text-[#4ADE80]" />
            <h2 className="text-white font-bold text-lg">Send a message</h2>
          </div>
          <ContactForm />
        </div>

        {/* Footer note */}
        <p className="text-center text-[#475569] text-xs mt-6">
          For payment disputes, include your transaction ID. We&apos;ll respond to your registered email.
        </p>
      </div>
    </div>
  )
}
