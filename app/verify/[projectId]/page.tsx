import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

// Temporary placeholder component
function VerificationUpload({ projectId }: { projectId: string }) {
  return (
    <div className="border p-4 rounded">
      <h2 className="text-lg font-semibold">Upload Verification</h2>
      <p>Project ID: {projectId}</p>
      <p className="text-sm text-gray-500">(Upload form coming soon)</p>
    </div>
  )
}

export default async function VerifyPage(props: any) {
  // ✅ FIX: params ko await karo aur safe access karo
  const params = await props.params
  const projectId = params?.projectId
  
  if (!projectId) return notFound()

  const supabase = await createClient()
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  if (!project) return notFound()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Verify Project</h1>
      <VerificationUpload projectId={projectId} />
    </div>
  )
}