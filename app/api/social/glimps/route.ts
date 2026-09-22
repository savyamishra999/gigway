import { NextRequest, NextResponse } from "next/server";
import { accessibleGlimpsPage, requireSocialUser, safePosts } from "@/lib/social/server";

export async function GET(request: NextRequest) {
  try {
    const viewer = await requireSocialUser(), cursor = request.nextUrl.searchParams.get("cursor");
    const page = await accessibleGlimpsPage(viewer?.id, cursor, 10);
    return NextResponse.json({ items: await safePosts(page.posts, viewer?.id), nextCursor: page.nextCursor });
  } catch { return NextResponse.json({ error: "glimps_unavailable" }, { status: 503 }); }
}
