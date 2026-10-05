import { getViewer, loginForCurrent } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import CreateChoices from "@/components/create/CreateChoices"

export default async function CreatePage() {
  const user = await getViewer()
  if (!user) redirect(await loginForCurrent("/create"))
  // Optional identity and Workplace data must not gate the personal actions.
  return <CreateChoices viewerId={user.id} />
}
