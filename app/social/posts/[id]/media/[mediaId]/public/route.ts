import { NextRequest } from "next/server";
import { deliverPostMedia } from "@/lib/media/deliver-post-media";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; mediaId: string }> };
export async function GET(request: NextRequest, { params }: Context) { return deliverPostMedia(request, params); }
export async function HEAD(request: NextRequest, { params }: Context) { return deliverPostMedia(request, params); }
