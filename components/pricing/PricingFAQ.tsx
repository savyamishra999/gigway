"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    q: "GigWay zero commission hai toh paise kaise kamata hai?",
    a: "Hum premium visibility features se revenue lete hain — jaise Boost aur Verified Badge. Basic use hamesha free rahega. Aapki kamai 100% aapki.",
  },
  {
    q: "Boost subscription cancel kar sakte hain?",
    a: "Haan, anytime. Koi lock-in nahi, koi hidden charges nahi. Apne dashboard se ek click mein cancel karen. Billing cycle khatam hone tak boost active rahega.",
  },
  {
    q: "Verified badge expire hota hai?",
    a: "Nahi — ek baar verified, hamesha verified. ₹299 ek baar pay karo, badge permanently aapke profile pe rahega.",
  },
  {
    q: "Payment safe hai?",
    a: "Haan — Razorpay se process hota hai, India ka #1 payment gateway. UPI, Cards, Net Banking sab accept karte hain. Aapka card detail hum kabhi store nahi karte.",
  },
  {
    q: "Agar boost kaam na kare toh?",
    a: "Pehle mahine mein full refund. No questions asked. Bas support@gigway.in pe message karo.",
  },
]

export default function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-white font-medium text-sm">{faq.q}</span>
            <ChevronDown
              className={`h-4 w-4 text-[#6B7280] flex-shrink-0 transition-transform duration-200 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4">
              <p className="text-[#94A3B8] text-sm leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
