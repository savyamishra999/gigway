import { createClient as createServiceClient } from "@supabase/supabase-js"
import AdsAdminClient from "./AdsAdminClient"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Advertisements — GigWay Admin" }

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdvertisementsAdminPage() {
  const { data: ads } = await adminDb
    .from("advertisements")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  return <AdsAdminClient initialAds={ads ?? []} />
}
