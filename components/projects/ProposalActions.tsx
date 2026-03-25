"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface ProposalActionsProps {
  proposalId: string
  projectId: string
  freelancerId: string
  clientId: string
}

export default function ProposalActions({ proposalId, projectId, freelancerId, clientId }: ProposalActionsProps) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAccept = async () => {
    setLoading("accept")
    // Accept this proposal
    await supabase.from("proposals").update({ status: "accepted" }).eq("id", proposalId)
    // Reject all other proposals for this project
    await supabase
      .from("proposals")
      .update({ status: "rejected" })
      .eq("project_id", projectId)
      .neq("id", proposalId)
    // Set project to in_progress
    await supabase.from("projects").update({ status: "in_progress" }).eq("id", projectId)
    // Notify freelancer
    await supabase.from("notifications").insert({
      user_id: freelancerId,
      type: "proposal_accepted",
      message: "Your proposal has been accepted!",
      link: `/projects/${projectId}`,
      is_read: false,
    })
    setLoading(null)
    router.refresh()
  }

  const handleReject = async () => {
    setLoading("reject")
    await supabase.from("proposals").update({ status: "rejected" }).eq("id", proposalId)
    // Notify freelancer
    await supabase.from("notifications").insert({
      user_id: freelancerId,
      type: "proposal_rejected",
      message: "Your proposal was not selected for this project.",
      link: `/projects/${projectId}`,
      is_read: false,
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-3 mt-5 justify-end">
      <Button
        onClick={handleAccept}
        disabled={loading !== null}
        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6"
      >
        {loading === "accept" ? "Accepting..." : "Accept"}
      </Button>
      <Button
        onClick={handleReject}
        disabled={loading !== null}
        variant="destructive"
        className="px-6"
      >
        {loading === "reject" ? "Rejecting..." : "Reject"}
      </Button>
    </div>
  )
}
