import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import OrganizationForm from "@/components/organizations/OrganizationForm"

export default async function EditOrganization({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: org } = await supabase.from("organizations").select("id,name,username,entity_type,logo_url,cover_url,tagline,description,website,industry,company_size,founded_year,location,country").eq("username", username).maybeSingle()
  if (!org) notFound()
  const { data: membership } = await supabase.from("organization_members").select("member_role").eq("organization_id", org.id).eq("profile_id", user.id).eq("status", "active").maybeSingle()
  if (!membership || !["owner", "admin"].includes(membership.member_role)) redirect(`/u/${username}`)
  return <main className="min-h-screen bg-brand-ivory px-4 py-10 pb-24"><section className="mx-auto min-w-0 max-w-3xl"><div className="mb-8"><p className="text-xs font-bold tracking-widest text-brand-indigo">MANAGE WORKPLACE</p><h1 className="mt-2 [overflow-wrap:anywhere] text-3xl font-bold text-brand-midnight">{org.name}</h1><p className="mt-2 text-brand-slate">Keep your Workplace identity accurate and recognisable.</p></div><OrganizationForm organization={org} /></section></main>
}
