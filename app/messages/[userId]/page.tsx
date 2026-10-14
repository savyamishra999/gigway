import { getViewer, loginForCurrent } from "@/lib/auth/server"
import { redirect, notFound } from "next/navigation"
import { uuid } from "@/lib/communication"
import MessagesClient from "@/components/messages/MessagesClient"
export default async function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  if (!uuid(userId)) notFound()
  const user = await getViewer()
  if (!user) redirect(await loginForCurrent(`/messages/${userId}`))
  if (user.id === userId) redirect("/messages")
  return <MessagesClient key={`${user.id}:${userId}`} viewerId={user.id} otherId={userId} />
}
