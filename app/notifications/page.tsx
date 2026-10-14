import { getViewer, loginForCurrent } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import NotificationsClient from "@/components/notifications/NotificationsClient"
export default async function NotificationsPage() {
  const user = await getViewer()
  if (!user) redirect(await loginForCurrent("/notifications"))
  return <NotificationsClient key={user.id} />
}
