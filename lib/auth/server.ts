import "server-only"
import { cache } from "react"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { withDeadline } from "@/lib/async"
import { safeReturnTo, loginHref, completionHref } from "./return-to"

export const getViewer = cache(async () => {
  const db = await createClient()
  const { data: { user }, error } = await withDeadline(db.auth.getUser())
  if (error && error.name !== "AuthSessionMissingError") throw new Error("Your session could not be checked. Please try again.")
  return user
})

export async function currentDestination(fallback = "/home") {
  return safeReturnTo((await headers()).get("x-gigway-destination"), fallback)
}

export async function loginForCurrent(fallback = "/home") {
  return loginHref(await currentDestination(fallback))
}

export async function completionForCurrent(fallback = "/home") {
  return completionHref(await currentDestination(fallback))
}
