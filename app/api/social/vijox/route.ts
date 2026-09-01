import { NextRequest, NextResponse } from "next/server";
import { accessibleJoxPage, requireSocialUser, safePost } from "@/lib/social/server";

export async function GET(request: NextRequest) {
  try { const viewer = await requireSocialUser(), page = await accessibleJoxPage(viewer?.id, request.nextUrl.searchParams.get("cursor"), 10); return NextResponse.json({ items: await Promise.all(page.posts.map(post => safePost(post, viewer?.id))), nextCursor: page.nextCursor }); }
  catch { return NextResponse.json({ error: "jox_unavailable" }, { status: 503 }); }
}
