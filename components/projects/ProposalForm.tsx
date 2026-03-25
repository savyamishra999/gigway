"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProposalFormProps {
  projectId: string
  userId: string
  onSuccess?: () => void
}

const MAX_COVER_LETTER = 500

export default function ProposalForm({ projectId, userId, onSuccess }: ProposalFormProps) {
  const [coverLetter, setCoverLetter] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [estimatedDays, setEstimatedDays] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Check connects balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("connects_balance")
      .eq("id", userId)
      .single()

    if (!profile || (profile.connects_balance ?? 0) < 1) {
      setMessage({ type: "error", text: "Insufficient connects. You need at least 1 connect to submit a proposal." })
      setLoading(false)
      return
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from("proposals")
      .select("id")
      .eq("project_id", projectId)
      .eq("freelancer_id", userId)
      .single()

    if (existing) {
      setMessage({ type: "error", text: "You have already submitted a proposal for this project." })
      setLoading(false)
      return
    }

    // Insert proposal
    const { error: proposalError } = await supabase.from("proposals").insert({
      project_id: projectId,
      freelancer_id: userId,
      cover_letter: coverLetter,
      bid_amount: parseFloat(bidAmount),
      estimated_days: parseInt(estimatedDays),
      status: "pending",
    })

    if (proposalError) {
      setMessage({ type: "error", text: "Error submitting proposal: " + proposalError.message })
      setLoading(false)
      return
    }

    // Deduct connect
    await supabase
      .from("profiles")
      .update({ connects_balance: (profile.connects_balance ?? 1) - 1 })
      .eq("id", userId)

    // Log transaction
    await supabase.from("connects_transactions").insert({
      user_id: userId,
      amount: -1,
      type: "debit",
      description: "Proposal submission",
    })

    setLoading(false)
    setMessage({ type: "success", text: "Proposal submitted successfully! 1 connect deducted." })
    setCoverLetter("")
    setBidAmount("")
    setEstimatedDays("")
    onSuccess?.()
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="border-b border-white/10 pb-3">
        <CardTitle className="text-white text-lg">Submit a Proposal</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div
              className={`p-3 rounded-lg border text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-gray-300">Cover Letter *</Label>
              <span className={`text-xs ${coverLetter.length > MAX_COVER_LETTER ? "text-red-400" : "text-gray-500"}`}>
                {coverLetter.length}/{MAX_COVER_LETTER}
              </span>
            </div>
            <Textarea
              value={coverLetter}
              onChange={e => {
                if (e.target.value.length <= MAX_COVER_LETTER) setCoverLetter(e.target.value)
              }}
              placeholder="Explain why you're the best fit for this project..."
              rows={5}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Bid Amount (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <Input
                  type="number"
                  min="1"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder="25000"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Estimated Days *</Label>
              <Input
                type="number"
                min="1"
                value={estimatedDays}
                onChange={e => setEstimatedDays(e.target.value)}
                placeholder="e.g. 14"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">Submitting uses 1 connect from your balance.</p>

          <Button
            type="submit"
            disabled={loading || coverLetter.length > MAX_COVER_LETTER}
            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold py-5"
          >
            {loading ? "Submitting..." : "Submit Proposal (1 Connect)"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
