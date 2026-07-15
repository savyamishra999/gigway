import { createClient } from "@/lib/supabase/server"
import { redirect }     from "next/navigation"
import VerifyClient     from "./VerifyClient"

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status,verification_paid_at,account_type,full_name,hire_talent_type")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-12 px-4">
      <VerifyClient
        status={profile?.verification_status ?? null}
        paidAt={profile?.verification_paid_at ?? null}
        isCompany={(profile?.account_type === "company") || (profile?.hire_talent_type === "company")}
        userName={profile?.full_name ?? null}
      />
    </div>
  )
}
