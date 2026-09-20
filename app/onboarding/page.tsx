import { redirect } from "next/navigation"
import { completionHref } from "@/lib/auth/return-to"

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  redirect(completionHref((await searchParams).next))
}
