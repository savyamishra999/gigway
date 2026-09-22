import { NextRequest, NextResponse } from "next/server";
import { accessibleJoxPage, requireSocialUser, safePosts } from "@/lib/social/server";

export async function GET(request: NextRequest) {
  try { const viewer = await requireSocialUser(), page = await accessibleJoxPage(viewer?.id, request.nextUrl.searchParams.get("cursor"), 10); return NextResponse.json({ items: await safePosts(page.posts, viewer?.id), nextCursor: page.nextCursor }); }
  catch { return NextResponse.json({ error: "jox_unavailable" }, { status: 503 }); }
}
