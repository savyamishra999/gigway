import { socialDb } from "@/lib/social/server";

export type ConnectionState = "none" | "outgoing_pending" | "incoming_pending" | "connected";
export async function connectionRow(currentUserId: string, targetProfileId: string) {
  const { data } = await socialDb().from("professional_connections").select("id,requester_user_id,recipient_user_id,status").or(`and(requester_user_id.eq.${currentUserId},recipient_user_id.eq.${targetProfileId}),and(requester_user_id.eq.${targetProfileId},recipient_user_id.eq.${currentUserId})`).maybeSingle();
  return data;
}
export async function resolveConnectionState(currentUserId: string, targetProfileId: string): Promise<ConnectionState> {
  if (!currentUserId || currentUserId === targetProfileId) return "none";
  const row = await connectionRow(currentUserId, targetProfileId);
  if (!row) return "none";
  if (row.status === "accepted") return "connected";
  if (row.status === "pending") return row.requester_user_id === currentUserId ? "outgoing_pending" : "incoming_pending";
  return "none";
}
