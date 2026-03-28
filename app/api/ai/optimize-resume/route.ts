import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bio, skills, jobFunction } = await req.json()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach for Indian freelancers. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Optimize this freelancer profile:

Bio: ${bio || "Not provided"}
Skills: ${Array.isArray(skills) ? skills.join(", ") : skills || "Not provided"}
Job Function: ${jobFunction || "Not provided"}

Return ONLY JSON in this format:
{
  "improved_bio": "...",
  "tagline": "...",
  "skill_suggestions": ["..."],
  "tips": ["..."]
}`,
        },
      ],
      max_tokens: 800,
    })

    const text = completion.choices?.[0]?.message?.content

    let result
    try {
      result = JSON.parse(text || "{}")
    } catch (e) {
      console.error("JSON parse failed:", text)
      return NextResponse.json(
        { error: "Invalid AI response", raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json(result)

  } catch (err: any) {
    console.error("AI ERROR FULL:", err)
    return NextResponse.json(
      { error: err.message || "AI service failed" },
      { status: 500 }
    )
  }
}