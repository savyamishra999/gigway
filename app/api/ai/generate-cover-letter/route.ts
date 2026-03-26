import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectTitle, projectDescription, freelancerBio, skills, tone } = await req.json()
    if (!projectTitle || !projectDescription) {
      return NextResponse.json({ error: "Project title and description are required" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })

    const prompt = `You are an expert cover letter writer for the Indian freelance market.

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

Return only the cover letter text, no extra formatting.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    })

    const coverLetter = response.choices[0].message.content?.trim() || ""
    return NextResponse.json({ success: true, coverLetter })
  } catch (err) {
    console.error("[ai/generate-cover-letter]", err)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
