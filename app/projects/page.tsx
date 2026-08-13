import { createClient } from "@/lib/supabase/server"
import ProjectsClient from "@/components/projects/ProjectsClient"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Projects | GigWay",
  description: "Find open freelance projects across web dev, design, writing, marketing and more. Post your project for free on GigWay.",
  openGraph: {
    title: "Browse Projects | GigWay",
    description: "GigWay's global project marketplace — zero commission, instant proposals.",
    type: "website",
  },
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: initialProjects }, { data: profile }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:client_id(full_name, is_verified), poster_name")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(30),
    user
      ? supabase.from("profiles").select("skills").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ])

  const mySkills = (profile?.skills as string[] | null) ?? []

  return (
    <div className="min-h-screen bg-brand-ivory">
      {/* Header */}
      <div className="bg-white border-b border-brand-borderLight py-10 sm:py-14">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-h1 font-extrabold text-brand-midnight">Find projects worth working on</h1>
              <p className="text-brand-slate text-body-sm sm:text-body-lg mt-2 max-w-xl">
                Discover real client projects that match your skills, budget and availability.
              </p>
            </div>
            <Link
              href="/projects/new"
              className="flex-shrink-0 bg-brand-indigo hover:bg-brand-indigoDark text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]"
            >
              + Post Project
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ProjectsClient initialProjects={initialProjects ?? []} mySkills={mySkills} />
      </div>
    </div>
  )
}
