import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import OrganizationForm from "@/components/organizations/OrganizationForm"
export default async function NewOrganizationPage() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); return <main className="min-h-screen bg-[#0A0A0F] py-10 px-4"><section className="max-w-2xl mx-auto bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6"><h1 className="text-2xl font-bold text-white">Create your company profile</h1><p className="text-sm text-[#94A3B8] mt-1 mb-6">Your personal GigWay profile remains separate.</p><OrganizationForm /></section></main> }
