import { createClient } from "@/lib/supabase/server"
import ProjectsClient from "@/components/projects/ProjectsClient"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Projects | GigWay — Hire Freelancers in India",
  description: "Find open freelance projects across web dev, design, writing, marketing and more. Post your project for free on GigWay.",
  openGraph: {
    title: "Browse Projects | GigWay",
    description: "Open freelance projects in India — zero commission, instant proposals.",
    type: "website",
  },
}

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: initialProjects } = await supabase
    .from("projects")
    .select("*, profiles:client_id(full_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(30)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a]">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Browse Projects</h1>
            <p className="text-gray-400 text-sm mt-1">Find freelance projects — zero commission on GigWay</p>
          </div>
          <Link
            href="/projects/new"
            className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            + Post Project
          </Link>
        </div>

        <ProjectsClient initialProjects={initialProjects ?? []} />
      </div>
    </div>
  )
}
