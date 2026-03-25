import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// Called after Razorpay payment success to record escrow hold
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { action, projectId, proposalId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

    // --- ACTION: verify + hold (after payment) ---
    if (action === "hold") {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !projectId || !proposalId) {
        return NextResponse.json({ error: "Missing fields for hold" }, { status: 400 })
      }

      // Verify signature
      const keySecret = process.env.RAZORPAY_KEY_SECRET || ""
      const generated = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex")

      if (generated !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }

      // Verify caller is project client
      const { data: project } = await supabase
        .from("projects")
        .select("id, client_id, budget")
        .eq("id", projectId)
        .single()

      if (!project || project.client_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const { data: proposal } = await supabase
        .from("proposals")
        .select("id, freelancer_id, bid_amount")
        .eq("id", proposalId)
        .single()

      if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 })

      // Accept proposal, reject others, set project in_progress + escrow info
      await supabase.from("proposals").update({ status: "accepted" }).eq("id", proposalId)
      await supabase
        .from("proposals")
        .update({ status: "rejected" })
        .eq("project_id", projectId)
        .neq("id", proposalId)

      await supabase.from("projects").update({
        status: "in_progress",
        escrow_status: "held",
        escrow_payment_id: razorpay_payment_id,
        escrow_amount: proposal.bid_amount,
      }).eq("id", projectId)

      // Notify freelancer
      await supabase.from("notifications").insert({
        user_id: proposal.freelancer_id,
        type: "proposal_accepted",
        message: `Your proposal was accepted! Payment of ₹${proposal.bid_amount.toLocaleString()} is held in escrow. Deliver great work!`,
        link: `/projects/${projectId}`,
        is_read: false,
      }).then(() => null, () => null)

      return NextResponse.json({ success: true, action: "held" })
    }

    // --- ACTION: release payment to freelancer ---
    if (action === "release") {
      if (!projectId) {
        return NextResponse.json({ error: "projectId required" }, { status: 400 })
      }

      const { data: project } = await supabase
        .from("projects")
        .select("id, client_id, escrow_status, escrow_amount, escrow_payment_id")
        .eq("id", projectId)
        .single()

      if (!project || project.client_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (project.escrow_status !== "held") {
        return NextResponse.json({ error: "No funds held in escrow" }, { status: 400 })
      }

      // Get accepted freelancer
      const { data: accepted } = await supabase
        .from("proposals")
        .select("freelancer_id")
        .eq("project_id", projectId)
        .eq("status", "accepted")
        .single()

      if (!accepted) return NextResponse.json({ error: "No accepted proposal" }, { status: 404 })

      // Mark escrow released + project completed
      await supabase.from("projects").update({
        escrow_status: "released",
        status: "completed",
      }).eq("id", projectId)

      // Notify freelancer
      await supabase.from("notifications").insert({
        user_id: accepted.freelancer_id,
        type: "payment_released",
        message: `Payment of ₹${project.escrow_amount?.toLocaleString()} has been released to you!`,
        link: `/projects/${projectId}`,
        is_read: false,
      }).then(() => null, () => null)

      return NextResponse.json({ success: true, action: "released" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    console.error("[escrow/release]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
