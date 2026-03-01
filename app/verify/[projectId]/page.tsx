"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const supabase = createClient()

const DUMMY_FREELANCER_ID =
  "22222222-2222-2222-2222-222222222222"

export default function VerifyProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || files.length === 0) return
    setLoading(true)

    const fileUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = `project-${params.projectId}/${Date.now()}-${file.name}`

      const { error } = await supabase.storage
        .from("verification-docs")
        .upload(fileName, file)

      if (!error) {
        const { data } = supabase.storage
          .from("verification-docs")
          .getPublicUrl(fileName)

        fileUrls.push(data.publicUrl)
      }
    }

    await supabase.from("verification_docs").insert({
      project_id: params.projectId,
      user_id: DUMMY_FREELANCER_ID,
      document_urls: fileUrls,
      status: "pending",
    })

    setLoading(false)
    router.push(
      `/projects/${params.projectId}?verification_submitted=true`
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Submit Verification Proof
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit for Verification"}
        </Button>
      </form>
    </div>
  )
}