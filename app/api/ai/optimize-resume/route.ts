import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bio, skills, jobFunction } = await req.json()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach for Indian freelancers. Give practical, concise advice.",
        },
        {
          role: "user",
          content: `Optimize this freelancer profile for the Indian market:
Bio: ${bio || "Not provided"}
Skills: ${Array.isArray(skills) ? skills.join(", ") : skills || "Not provided"}
Job Function: ${jobFunction || "Not provided"}

Return JSON: { "improved_bio": "...", "tagline": "...", "skill_suggestions": ["..."], "tips": ["..."] }`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    })

    const result = JSON.parse(completion.choices[0].message.content || "{}")
    return NextResponse.json(result)
  } catch (err) {
    console.error("[ai/optimize-resume]", err)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
