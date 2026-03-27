import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectDescription, userSkills, userName } = await req.json()
    if (!projectDescription) {
      return NextResponse.json({ error: "Project description is required" }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert cover letter writer for the Indian freelance market. Write compelling, concise proposals.",
        },
        {
          role: "user",
          content: `Write a cover letter for a freelancer applying to this project.
Name: ${userName || "Freelancer"}
Project Description: ${projectDescription}
Skills: ${Array.isArray(userSkills) ? userSkills.join(", ") : userSkills || "Not provided"}

Requirements: 150-200 words, start with a hook, highlight relevant experience, end with a call to action. Sound genuine, not generic.

Return JSON: { "cover_letter": "..." }`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    })

    const result = JSON.parse(completion.choices[0].message.content || "{}")
    return NextResponse.json(result)
  } catch (err) {
    console.error("[ai/generate-cover-letter]", err)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
