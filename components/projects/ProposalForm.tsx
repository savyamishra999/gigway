"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface ProposalFormProps {
  projectId: string
  userId: string
  onSuccess?: () => void
  projectTitle?: string
  projectDescription?: string
}

const MAX_COVER_LETTER = 500

export default function ProposalForm({ projectId, userId, onSuccess, projectTitle, projectDescription }: ProposalFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [estimatedDays, setEstimatedDays] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()

  const generateWithAI = async () => {
    setGenerating(true)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, bio, skills, job_function")
        .eq("id", userId)
        .single()

      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: projectTitle || "Project",
          projectDescription: projectDescription || "",
          freelancerName: profile?.full_name || "",
          skills: profile?.skills?.join(", ") || "",
          bio: profile?.bio || "",
        }),
      })
      const data = await res.json()
      if (data.coverLetter) {
        const trimmed = data.coverLetter.slice(0, MAX_COVER_LETTER)
        setCoverLetter(trimmed)
      } else {
        setMessage({ type: "error", text: "AI generation failed. Please try again." })
      }
    } catch {
      setMessage({ type: "error", text: "AI generation failed. Please try again." })
    }
    setGenerating(false)
  }

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

  if (!showForm) {
    return (
      <div className="bg-white border border-brand-borderLight rounded-card p-6 text-center shadow-soft">
        <h3 className="text-brand-midnight font-bold text-lg mb-2">Interested in this project?</h3>
        <p className="text-brand-slate text-sm mb-5">{projectTitle}</p>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold px-10 py-5 text-base shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]"
        >
          Submit Proposal
        </Button>
      </div>
    )
  }

  return (
    <Card className="bg-white border-brand-borderLight shadow-soft">
      <CardHeader className="border-b border-brand-borderLight pb-3">
        <CardTitle className="text-brand-midnight text-lg">Submit a Proposal</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div
              role="alert"
              className={`p-3 rounded-lg border text-sm font-medium ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-brand-midnight">Cover Letter *</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={generating}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-indigo hover:text-brand-indigoDark disabled:opacity-50 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generating ? "Generating..." : "Generate with AI ✨"}
                </button>
                <span className={`text-xs ${coverLetter.length > MAX_COVER_LETTER ? "text-red-500" : "text-brand-slate"}`}>
                  {coverLetter.length}/{MAX_COVER_LETTER}
                </span>
              </div>
            </div>
            <Textarea
              value={coverLetter}
              onChange={e => {
                if (e.target.value.length <= MAX_COVER_LETTER) setCoverLetter(e.target.value)
              }}
              placeholder="Explain why you're the best fit for this project..."
              rows={5}
              required
              className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/70 focus:border-brand-indigo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-brand-midnight">Bid Amount (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate font-medium">₹</span>
                <Input
                  type="number"
                  min="1"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder="25000"
                  required
                  className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/70 focus:border-brand-indigo pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-brand-midnight">Estimated Days *</Label>
              <Input
                type="number"
                min="1"
                value={estimatedDays}
                onChange={e => setEstimatedDays(e.target.value)}
                placeholder="e.g. 14"
                required
                className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/70 focus:border-brand-indigo"
              />
            </div>
          </div>

          <p className="text-xs text-brand-slate">Submitting uses 1 connect from your balance.</p>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || coverLetter.length > MAX_COVER_LETTER}
              className="flex-1 bg-brand-indigo hover:bg-brand-indigoDark text-white font-semibold py-5 shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]"
            >
              {loading ? "Submitting..." : "Submit Proposal (1 Connect)"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-brand-borderLight text-brand-slate hover:bg-brand-ivory"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
