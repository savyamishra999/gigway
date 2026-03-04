// ... after exchanging code for session
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (!profile?.user_type) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }
}
return NextResponse.redirect(`${origin}`)