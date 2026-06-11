import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import AdminSidebar from "@/components/admin/AdminSidebar"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",")
  .map(e => e.trim().toLowerCase())

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirect=/admin")
  if (!ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) redirect("/dashboard")

  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || "/admin"

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <AdminSidebar pathname={pathname} />
      <main className="flex-1 md:ml-56 pb-20 md:pb-0 min-w-0">
        {children}
      </main>
    </div>
  )
}
