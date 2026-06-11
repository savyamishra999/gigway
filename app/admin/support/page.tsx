import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Headphones } from "lucide-react"
import AdminSupportClient from "@/components/admin/AdminSupportClient"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export const metadata: Metadata = { title: "Admin — Support — GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

export default async function AdminSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  // Use service role to bypass RLS (support_tickets has service_role read policy)
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: open },
    { data: urgent },
    { data: closed },
  ] = await Promise.all([
    adminClient.from("support_tickets")
      .select("id,name,email,subject,message,status,created_at,user_id,admin_reply")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    adminClient.from("support_tickets")
      .select("id,name,email,subject,message,status,created_at,user_id,admin_reply")
      .eq("status", "in_progress")
      .order("created_at", { ascending: false }),
    adminClient.from("support_tickets")
      .select("id,name,email,subject,message,status,created_at,user_id,admin_reply")
      .eq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
            <Headphones className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Support</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">
              {(open ?? []).length} open · {(urgent ?? []).length} in progress
            </p>
          </div>
        </div>

        <AdminSupportClient
          open={open ?? []}
          urgent={urgent ?? []}
          closed={closed ?? []}
        />
      </div>
    </div>
  )
}
