import { loginForCurrent } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import OrganizationForm from "@/components/organizations/OrganizationForm"
export default async function NewOrganizationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(await loginForCurrent("/organizations/new"))
  return <main className="min-h-screen bg-brand-ivory px-4 py-10 pb-24"><section className="mx-auto min-w-0 max-w-3xl"><div className="mb-8"><p className="text-xs font-bold tracking-widest text-brand-indigo">WORKPLACE</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-midnight">Create Workplace</h1><p className="mt-3 max-w-xl text-brand-slate">Give your business, brand or team a professional home on GigWay.</p></div><OrganizationForm /></section></main>
}
