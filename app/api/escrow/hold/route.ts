import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Razorpay from "razorpay"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { proposalId, projectId } = await req.json()
    if (!proposalId || !projectId) {
      return NextResponse.json({ error: "proposalId and projectId required" }, { status: 400 })
    }

    // Verify caller is the project client
    const { data: project } = await supabase
      .from("projects")
      .select("id, client_id, title, budget, status")
      .eq("id", projectId)
      .single()

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (project.status !== "open") {
      return NextResponse.json({ error: "Project is not open for escrow" }, { status: 400 })
    }

    // Get proposal bid_amount
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, bid_amount, freelancer_id, status")
      .eq("id", proposalId)
      .eq("project_id", projectId)
      .single()

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""
    const keySecret = process.env.RAZORPAY_KEY_SECRET || ""

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const amountInPaise = Math.round(proposal.bid_amount * 100)
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `escrow_${projectId}_${proposalId}`,
      notes: {
        type: "escrow",
        project_id: projectId,
        proposal_id: proposalId,
        freelancer_id: proposal.freelancer_id,
      },
    })

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      project_title: project.title,
      bid_amount: proposal.bid_amount,
    })
  } catch (err) {
    console.error("[escrow/hold]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
