import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectTitle, projectDescription, freelancerBio, skills, tone } = await req.json()
    if (!projectTitle || !projectDescription) {
      return NextResponse.json({ error: "Project title and description are required" }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an expert cover letter writer for the Indian freelance market.

Write a compelling cover letter/proposal for a freelancer applying to this project.

Project Title: ${projectTitle}
Project Description: ${projectDescription}
${freelancerBio ? `Freelancer Bio: ${freelancerBio}` : ""}
${skills?.length ? `Skills: ${skills.join(", ")}` : ""}
Tone: ${tone || "professional but personable"}

Requirements:
- 150-200 words
- Start with a hook that shows understanding of the project
- Highlight relevant experience
- End with a clear call to action
- Sound genuine, not generic
- Suitable for the Indian market context

Return only the cover letter text, no extra formatting.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected AI response" }, { status: 500 })
    }

    return NextResponse.json({ success: true, coverLetter: content.text.trim() })
  } catch (err) {
    console.error("[ai/generate-cover-letter]", err)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
