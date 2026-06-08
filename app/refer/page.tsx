import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ReferClient from "@/components/refer/ReferClient"

export const metadata: Metadata = {
  title: "Refer & Earn — GigWay",
  description: "Refer friends to GigWay and both get 5 free connects.",
}

function genRefCode(name: string | null): string {
  const prefix = (name ?? "user").replace(/[^a-zA-Z]/g, "").slice(0, 4).toLowerCase().padEnd(4, "x")
  const suffix = Math.floor(1000 + Math.random() * 9000).toString()
  return prefix + suffix
}

export default async function ReferPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/refer")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_ref_code, connects_balance")
    .eq("id", user.id)
    .single()

  let refCode = profile?.user_ref_code
  if (!refCode) {
    refCode = genRefCode(profile?.full_name ?? null)
    await supabase.from("profiles").update({ user_ref_code: refCode }).eq("id", user.id)
  }

  const { count: totalReferred } = await supabase
    .from("connects_transactions")
    .select("id", { count: "exact", head: true })
    .eq("ref_code", refCode)
    .eq("type", "referral_bonus")
    .neq("user_id", user.id)

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-16 px-4">
      <ReferClient
        refCode={refCode}
        name={profile?.full_name ?? "Friend"}
        connectsBalance={profile?.connects_balance ?? 0}
        totalReferred={totalReferred ?? 0}
      />
    </div>
  )
}
