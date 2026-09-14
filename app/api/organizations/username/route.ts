import { NextRequest, NextResponse } from "next/server"
import { checkUsernameClaim } from "@/lib/identity/username-server"

export async function GET(request: NextRequest) {
  const check = await checkUsernameClaim(request.nextUrl.searchParams.get("username"))
  return NextResponse.json({ available: !check.error, ...(check.error ? { error: check.error } : {}) }, { status: check.status, headers: { "Cache-Control": "no-store" } })
}
