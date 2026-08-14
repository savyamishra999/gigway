import { NextResponse } from "next/server"

// Kept unavailable until Resume Intelligence ships with its final limits.
export async function POST() {
  return NextResponse.json({ error: "Resume Intelligence is coming soon." }, { status: 410 })
}
