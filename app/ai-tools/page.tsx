import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ResumeOptimizer from "@/components/ai/ResumeOptimizer"
import CoverLetterWriter from "@/components/ai/CoverLetterWriter"
import { Sparkles, Zap } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Tools | GigWay",
  description: "AI-powered tools to optimize your resume and generate winning cover letters for freelance projects.",
}

export default async function AIToolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#4F46E5]/10 border border-[#4F46E5]/30 px-4 py-1.5 rounded-full mb-4">
            <Zap className="h-3.5 w-3.5 text-[#818CF8]" />
            <span className="text-[#818CF8] text-xs font-semibold">Powered by Claude AI</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            AI <span className="bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">Superpowers</span>
          </h1>
          <p className="text-[#6B7280] max-w-lg mx-auto">
            Beat the competition with AI-crafted profiles and proposals. Land more clients, win more projects.
          </p>
        </div>

        {/* Tips Banner */}
        <div className="bg-gradient-to-r from-[#4F46E5]/10 to-[#F97316]/10 border border-[#4F46E5]/20 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <Sparkles className="h-5 w-5 text-[#818CF8] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm mb-1">Pro Tips for Best Results</p>
            <ul className="text-[#6B7280] text-xs space-y-1">
              <li>• The more detail you provide, the better the AI output</li>
              <li>• Always personalize the generated content before using it</li>
              <li>• Use the Resume Optimizer before applying to high-value projects</li>
            </ul>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="space-y-6">
          <ResumeOptimizer />
          <CoverLetterWriter />
        </div>
      </div>
    </div>
  )
}
