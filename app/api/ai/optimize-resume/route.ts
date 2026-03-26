import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { resumeText, targetRole } = await req.json()
    if (!resumeText?.trim()) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })

    const prompt = `You are an expert resume writer and career coach specializing in the Indian freelance and tech market.

Optimize the following resume/profile for someone targeting: ${targetRole || "freelance opportunities on GigWay"}

Resume/Profile:
${resumeText}

Please provide:
1. An improved, ATS-friendly version of their profile summary (2-3 sentences)
2. 5 specific improvements they should make
3. 5 power keywords they should add
4. A suggested tagline (max 10 words)

Format your response as JSON with keys: summary, improvements (array), keywords (array), tagline`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    })

    const text = response.choices[0].message.content || ""

    let result: Record<string, unknown>
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text }
    } catch {
      result = { raw: text }
    }

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error("[ai/optimize-resume]", err)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
