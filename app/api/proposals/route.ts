import { NextResponse } from "next/server"
// The previous path inserted proposals, debited connects and logged separately.
// Fail closed until actual database transaction/RLS guarantees are verified.
export async function POST() {
  return NextResponse.json({ error: "Proposal submissions are temporarily paused while we update submission safety. No connects or payments will be deducted." }, { status: 503 })
}
