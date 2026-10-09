import "server-only"
import { getViewer } from "@/lib/auth/server"

export async function adminViewer() {
  const user = await getViewer()
  const allowed = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(email => email.trim().toLowerCase())
  return user?.email && allowed.includes(user.email.toLowerCase()) ? user : null
}
