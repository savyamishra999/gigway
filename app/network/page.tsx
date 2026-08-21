import { redirect } from "next/navigation"; import NetworkClient from "@/components/connections/NetworkClient"; import { createClient } from "@/lib/supabase/server";
export default async function NetworkPage() { const db = await createClient(); const { data: { user } } = await db.auth.getUser(); if (!user) redirect("/login?next=/network"); return <NetworkClient />; }
