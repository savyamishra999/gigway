"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface JobApplyButtonProps {
  jobId: string
  userId: string
  jobTitle: string
}

export default function JobApplyButton({ jobId, userId, jobTitle }: JobApplyButtonProps) {
  const [showForm, setShowForm] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.from("job_applications").insert({
      job_id: jobId,
      applicant_id: userId,
      cover_letter: coverLetter || null,
      status: "pending",
    })

    setLoading(false)
    if (error) {
      setMessage({ type: "error", text: "Error applying: " + error.message })
    } else {
      setMessage({ type: "success", text: "Application submitted successfully!" })
      router.refresh()
    }
  }

  if (!showForm) {
    return (
      <div className="bg-white border border-brand-borderLight rounded-card p-6 text-center shadow-soft">
        <h3 className="text-brand-midnight font-bold text-lg mb-2">Interested in this role?</h3>
        <p className="text-brand-slate text-sm mb-5">{jobTitle}</p>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold px-10 py-5 text-base shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]"
        >
          Apply Now
        </Button>
      </div>
    )
  }

  return (
    <Card className="bg-white border-brand-borderLight shadow-soft">
      <CardHeader className="border-b border-brand-borderLight pb-3">
        <CardTitle className="text-brand-midnight text-lg">Submit Application</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleApply} className="space-y-4">
          {message && (
            <div
              role="alert"
              className={`p-3 rounded-lg border text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-brand-midnight">Cover Letter (optional)</Label>
            <Textarea
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this role..."
              rows={5}
              className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/70 focus:border-brand-indigo"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold py-5 shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]"
            >
              {loading ? "Submitting..." : "Submit Application"}
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
