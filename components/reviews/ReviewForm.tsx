"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ReviewFormProps {
  revieweeId: string
  projectId: string
}

export default function ReviewForm({ revieweeId, projectId }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setMessage({ type: "error", text: "Please select a star rating." })
      return
    }
    setLoading(true)
    setMessage(null)

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewee_id: revieweeId, project_id: projectId, rating, comment }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Failed to submit review." })
    } else {
      setMessage({ type: "success", text: "Review submitted! Thank you." })
      setRating(0)
      setComment("")
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-5">Leave a Review</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Star Rating */}
        <div className="space-y-2">
          <Label className="text-gray-300">Rating *</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hovered || rating)
                      ? "fill-[#FFD700] text-[#FFD700]"
                      : "text-gray-600 hover:text-[#FFD700]"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-gray-400 text-sm ml-2">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label className="text-gray-300">Comment (optional)</Label>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience working on this project..."
            rows={4}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || rating === 0}
          className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold px-8"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  )
}
