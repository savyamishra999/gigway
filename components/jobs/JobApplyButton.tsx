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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <h3 className="text-white font-semibold text-lg mb-2">Interested in this role?</h3>
        <p className="text-gray-400 text-sm mb-5">{jobTitle}</p>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold px-10 py-5 text-base"
        >
          Apply Now
        </Button>
      </div>
    )
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="border-b border-white/10 pb-3">
        <CardTitle className="text-white text-lg">Submit Application</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleApply} className="space-y-4">
          {message && (
            <div
              className={`p-3 rounded-lg border text-sm ${
                message.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-300">Cover Letter (optional)</Label>
            <Textarea
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this role..."
              rows={5}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-5"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
