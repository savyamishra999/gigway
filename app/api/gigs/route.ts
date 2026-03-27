import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")

  let query = supabase
    .from("gigs")
    .select("*, profiles:owner_id(full_name, avg_rating, is_verified)")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (category && category !== "all") query = query.ilike("category", category)

  const { data: gigs, error } = await query

  if (error) {
    console.error("Route error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let results = gigs || []

  if (search) {
    const s = search.toLowerCase()
    results = results.filter(
      (g: { title?: string; tags?: string[] }) =>
        g.title?.toLowerCase().includes(s) ||
        g.tags?.some((t: string) => t.toLowerCase().includes(s))
    )
  }

  return NextResponse.json({ gigs: results })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, category, price, delivery_days, tags } = body

  if (!title || !price || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data: gig, error } = await supabase
    .from("gigs")
    .insert({
      owner_id: user.id,
      title,
      description: description || null,
      category: category.toLowerCase(),
      price: parseFloat(price),
      delivery_days: parseInt(delivery_days) || 3,
      tags: tags || [],
      status: "active",
    })
    .select("id")
    .single()

  if (error) {
    console.error("Route error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, gig_id: gig.id }, { status: 201 })
}
