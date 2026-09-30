import { getViewer, loginForCurrent } from "@/lib/auth/server"
import { redirect } from "next/navigation"; import NetworkClient from "@/components/connections/NetworkClient";
export default async function NetworkPage() { const user = await getViewer(); if (!user) redirect(await loginForCurrent("/network")); return <NetworkClient />; }
