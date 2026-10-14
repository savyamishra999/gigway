import { getViewer, loginForCurrent } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import MessagesClient from "@/components/messages/MessagesClient"
export default async function MessagesPage() {
  const user = await getViewer()
  if (!user) redirect(await loginForCurrent("/messages"))
  return <MessagesClient key={user.id} viewerId={user.id} />
}
