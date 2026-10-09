# Profile source query inventory

Generated from TypeScript AST across app/, lib/, components/. Includes dormant components, admin/server access and explicit embedded profile relations. Dynamic username lookup also queries profiles/organizations in lib/identity/username-server.ts using a verified server client. Source inventory is not a live schema inventory.

## app/admin/broadcast/page.tsx:27

admin (verified server required)

```ts
adminDb.from("profiles").select("id", { count: "exact", head: true })
```

## app/admin/broadcast/page.tsx:28

admin (verified server required)

```ts
adminDb.from("profiles").select("id", { count: "exact", head: true }).eq("is_boosted", true)
```

## app/admin/employers/page.tsx:49

admin (verified server required)

```ts
adminDb.from("profiles").select("id", { count: "exact", head: true }).contains("user_roles", ["hire_talent"])
```

## app/admin/employers/page.tsx:50

admin (verified server required)

```ts
adminDb.from("profiles").select("id", { count: "exact", head: true }) .contains("user_roles", ["hire_talent"]).eq("is_employer_verified", true)
```

## app/admin/employers/page.tsx:52

admin (verified server required)

```ts
adminDb.from("profiles").select("id", { count: "exact", head: true }) .contains("user_roles", ["hire_talent"]).eq("plan", "hire_talent").gt("plan_expires_at", now)
```

## app/admin/employers/page.tsx:58

admin (verified server required)

```ts
adminDb .from("profiles") .select( "id,full_name,email,company_name,company_size,account_type,is_employer_verified,is_banned,plan,plan_expires_at,created_at", { count: "exact" } ) .contains("user_roles", ["hire_talent"])
```

## app/admin/freelancers/page.tsx:34

admin (verified server required)

```ts
db .from("profiles") .select( "id,full_name,email,avatar_url,skills,hourly_rate,is_verified,is_boosted,is_banned,boost_expires_at,created_at", { count: "exact" } )
```

## app/admin/social/page.tsx:25

admin (verified server required)

```ts
adminDb .from("gigs") .select("id, title, price, category, profiles:freelancer_id(full_name, verification_status)") .eq("status", "active") .order("created_at", { ascending: false }) .limit(30)
```

## app/admin/social/page.tsx:39

admin (verified server required)

```ts
adminDb .from("profiles") .select("id, full_name, skills, hourly_rate, location, verification_status") .eq("profile_completed", true) .contains("user_roles", ["find_work"]) .order("created_at", { ascending: false }) .limit(30)
```

## app/admin/special-grants/page.tsx:22

admin (verified server required)

```ts
adminDb .from("admin_grants") .select("id, grant_type, note, granted_at, profiles:user_id(full_name, email)") .order("granted_at", { ascending: false }) .limit(50)
```

## app/admin/users/page.tsx:36

admin (verified server required)

```ts
db .from("profiles") .select( "id,full_name,email,phone,created_at,is_boosted,is_verified,verification_status,boost_expires_at,subscription_tier,user_roles,find_work_type,hire_talent_type,plan,plan_expires_at", { count: "exact" } )
```

## app/admin/verifications/page.tsx:28

admin (verified server required)

```ts
adminDb .from("profiles") .select("id,full_name,email,phone,aadhaar_front_url,aadhaar_back_url,verification_paid_at,verification_doc,account_type,user_roles,find_work_type,hire_talent_type,created_at") .eq("verification_status", "pending") .order("created_at", { ascending: true })
```

## app/admin/verifications/page.tsx:58

admin (verified server required)

```ts
adminDb.from("profiles").select("id", { count: "exact", head: true }) .eq("verification_status", "pending")
```

## app/admin/verifications/page.tsx:60

admin (verified server required)

```ts
adminDb.from("profiles").select("id", { count: "exact", head: true }) .eq("is_verified", true)
```

## app/api/admin/broadcast/route.ts:31

admin (verified server required)

```ts
adminDb.from("profiles").select("id")
```

## app/api/admin/delete-user/route.ts:56

admin (verified server required)

```ts
adminClient.from("profiles").delete().eq("id", userId)
```

## app/api/admin/employers/route.ts:29

admin (verified server required)

```ts
adminDb .from("profiles") .update({ is_employer_verified: true }) .eq("id", id)
```

## app/api/admin/employers/route.ts:48

admin (verified server required)

```ts
adminDb .from("profiles") .update({ is_banned: true }) .eq("id", id)
```

## app/api/admin/employers/route.ts:57

admin (verified server required)

```ts
adminDb .from("profiles") .update({ is_banned: false }) .eq("id", id)
```

## app/api/admin/employers/route.ts:76

admin (verified server required)

```ts
adminDb.from("profiles").delete().eq("id", id)
```

## app/api/admin/find-user/route.ts:18

admin (verified server required)

```ts
supabase .from("profiles") .select("id, full_name, email") .ilike("email", email.trim()) .single()
```

## app/api/admin/freelancer-action/route.ts:34

admin (verified server required)

```ts
adminDb.from("profiles").update(safe).eq("id", userId)
```

## app/api/admin/grant-badge/route.ts:29

admin (verified server required)

```ts
adminDb.from("profiles").update(update).eq("id", userId)
```

## app/api/admin/revenue/export/route.ts:20

admin (verified server required)

```ts
supabase .from("subscriptions") .select("plan, payment_id, order_id, created_at, profiles:user_id(full_name, email)") .eq("status", "active") .order("created_at", { ascending: false }) .limit(5000)
```

## app/api/admin/special-grant/route.ts:20

admin (verified server required)

```ts
supabase.from("profiles") .update({ is_verified: true, verification_status: "verified" }) .eq("id", userId)
```

## app/api/admin/special-grant/route.ts:25

admin (verified server required)

```ts
supabase.from("profiles") .update({ is_boosted: true, boost_expires_at: exp, boost_plan: "boost_1m" }) .eq("id", userId)
```

## app/api/admin/special-grant/route.ts:30

admin (verified server required)

```ts
supabase.from("profiles") .update({ is_boosted: true, boost_expires_at: exp, boost_plan: "boost_3m" }) .eq("id", userId)
```

## app/api/admin/special-grant/route.ts:35

admin (verified server required)

```ts
supabase.from("profiles") .update({ is_boosted: true, boost_expires_at: exp, boost_plan: "boost_6m" }) .eq("id", userId)
```

## app/api/admin/special-grant/route.ts:39

admin (verified server required)

```ts
supabase.from("profiles").update({ is_banned: false }).eq("id", userId)
```

## app/api/admin/verify-freelancer/route.ts:36

admin (verified server required)

```ts
adminDb .from("profiles") .update({ verification_status: null, aadhaar_front_url: null, aadhaar_back_url: null, verification_doc: null, }) .eq("id", userId)
```

## app/api/admin/verify-freelancer/route.ts:51

admin (verified server required)

```ts
adminDb .from("profiles") .update({ is_verified: true, verification_status: "approved" }) .eq("id", userId)
```

## app/api/admin/verify-freelancer/route.ts:72

admin (verified server required)

```ts
adminDb .from("profiles") .update({ verification_status: "rejected", is_verified: false }) .eq("id", userId)
```

## app/api/connections/route.ts:26

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url,tagline,location,is_verified").in("id", ids)
```

## app/api/gigs/route.ts:14

embedded relation

```ts
supabase .from("gigs") .select("*, profiles:owner_id(full_name, avg_rating, is_verified)") .eq("status", "active") .order("created_at", { ascending: false })
```

## app/api/identity/complete/route.ts:18

owner-only read

```ts
supabase.from("own_profiles").select("id, user_roles").eq("id", user.id).maybeSingle()
```

## app/api/identity/complete/route.ts:21

write (review client/authorization)

```ts
adminDb.from("profiles").upsert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? null, avatar_url: null, profile_completed: false, user_roles: [], }, { onConflict: "id", ignoreDuplicates: true })
```

## app/api/identity/complete/route.ts:30

owner-only read

```ts
supabase.from("own_profiles").select("id, user_roles").eq("id", user.id).maybeSingle()
```

## app/api/identity/complete/route.ts:92

write (review client/authorization)

```ts
adminDb.from("profiles").update(updatePayload).eq("id", profileId)
```

## app/api/identity/google-avatar/route.ts:17

public columns or explicit server query

```ts
db.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle()
```

## app/api/jobs/route.ts:14

embedded relation

```ts
supabase .from("jobs") .select("*, profiles:client_id(full_name, company, avatar_url)") .eq("status", "active") .order("created_at", { ascending: false })
```

## app/api/onboarding/complete/route.ts:55

write (review client/authorization)

```ts
adminDb .from("profiles") .upsert({ id: user.id, email: user.email, user_roles, find_work_type: find_work_type ?? null, hire_talent_type: hire_talent_type ?? null, account_type: account_type ?? "individual", full_name: full_name.trim(), phone: phone?.trim() ?? null, avatar_url: avatar_url ?? null, bio: bio ?? null, location: location ?? null, job_function: job_function ?? null, skills: skills ?? [], portfolio_links: portfolio_links ?? [], hourly_rate: hourly_rate ?? null, experience_years: experience_years ?? null, experience_description: experience_description ?? null, linkedin_url: linkedin_url ?? null, cv_url: cv_url ?? null, expected_salary: expected_salary ?? null, preferred_job_type: preferred_job_type ?? null, company_name: company_name ?? null, company_size: company_size ?? null, company_website: company_website ?? null, industry: industry ?? null, gst_number: gst_number ?? null, profile_completed: true, }, { onConflict: "id" })
```

## app/api/payment/create-order/route.ts:13

public columns or explicit server query

```ts
supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()
```

## app/api/profile/route.ts:18

public columns or explicit server query

```ts
db.from("profiles").select("portfolio_links").eq("id", user.id).maybeSingle()
```

## app/api/profile/route.ts:31

write (review client/authorization)

```ts
db.from("profiles").update(updates).eq("id", user.id)
```

## app/api/reviews/route.ts:64

write (review client/authorization)

```ts
supabase.from("profiles").update({ avg_rating: Math.round(avg * 10) / 10, total_reviews: allReviews.length, }).eq("id", reviewee_id)
```

## app/api/social/follow/profile/[profileId]/route.ts:2

public columns or explicit server query

```ts
db.from("profiles").select("id").eq("id",profileId).maybeSingle()
```

## app/api/social/marketplace-shares/route.ts:25

public columns or explicit server query

```ts
db.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
```

## app/api/social/mentions/route.ts:2

public columns or explicit server query

```ts
socialDb().from("profiles").select("id,full_name,username,avatar_url,tagline").ilike("username",`${q}%`).eq("profile_completed",true).limit(6)
```

## app/api/social/posts/route.ts:87

public columns or explicit server query

```ts
db.from("profiles").select("profile_completed").eq("id", user.id).maybeSingle()
```

## app/api/social/posts/route.ts:95

public columns or explicit server query

```ts
db.from("profiles").select("id,username").in("username", mentions)
```

## app/api/social/posts/route.ts:96

public columns or explicit server query

```ts
db.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
```

## app/api/social/posts/route.ts:155

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url").in("id", repostActorIds)
```

## app/api/social/posts/route.ts:169

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url").in("id", shareUserIds)
```

## app/api/social/posts/[id]/comments/route.ts:3

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url,is_verified").in("id",ids)
```

## app/api/social/posts/[id]/like/route.ts:2

public columns or explicit server query

```ts
db.from("profiles").select("full_name").eq("id",u.id).maybeSingle()
```

## app/api/social/posts/[id]/repost/route.ts:2

public columns or explicit server query

```ts
db.from("profiles").select("full_name").eq("id",u.id).maybeSingle()
```

## app/api/tools/career-gap-map/route.ts:1

owner-only read

```ts
db.from("own_profiles").select("tagline,bio,skills,job_function,find_work_type,location,experience_years,experience_description,portfolio_links").eq("id",user.id).maybeSingle()
```

## app/api/tools/opportunity-match/route.ts:7

public columns or explicit server query

```ts
db.from("profiles").select("tagline,bio,skills,job_function,experience_years,experience_description").eq("id",user.id).maybeSingle()
```

## app/api/tools/profile-intelligence/route.ts:2

owner-only read

```ts
db.from("own_profiles").select("tagline,bio,skills,job_function,find_work_type,hire_talent_type,location,experience_years,experience_description,portfolio_links").eq("id",user.id).maybeSingle()
```

## app/api/tools/smart-proposal/route.ts:1

public columns or explicit server query

```ts
db.from("profiles").select("tagline,bio,skills,job_function,experience_years,experience_description,portfolio_links").eq("id",user.id).maybeSingle()
```

## app/api/verify-me/route.ts:29

owner-only read

```ts
supabase .from("own_profiles") .select("verification_status") .eq("id", user.id) .single()
```

## app/api/verify-me/route.ts:42

write (review client/authorization)

```ts
supabase .from("profiles") .update({ verification_doc: doc }) .eq("id", user.id)
```

## app/api/verify-me/upload/route.ts:24

owner-only read

```ts
supabase .from("own_profiles") .select("verification_paid_at, verification_status") .eq("id", user.id) .single()
```

## app/api/verify-me/upload/route.ts:79

write (review client/authorization)

```ts
supabase .from("profiles") .update({ aadhaar_front_url: frontPath, aadhaar_back_url: backPath, verification_status: "pending", ...(docType ? { verification_doc: `company:${docType}` } : {}), }) .eq("id", user.id)
```

## app/api/webhooks/razorpay/route.ts:96

write (review client/authorization)

```ts
supabase.from("profiles").update({ is_boosted: true, boost_expires_at: expiresAt, boost_plan: planType, }).eq("id", userId)
```

## app/api/webhooks/razorpay/route.ts:103

write (review client/authorization)

```ts
supabase.from("profiles") .update({ verification_paid_at: new Date().toISOString() }) .eq("id", userId)
```

## app/api/webhooks/razorpay/route.ts:108

public columns or explicit server query

```ts
supabase .from("profiles").select("connects_balance").eq("id", userId).single()
```

## app/api/webhooks/razorpay/route.ts:111

write (review client/authorization)

```ts
supabase.from("profiles") .update({ connects_balance: current + CONNECTS_MAP[planType] }) .eq("id", userId)
```

## app/auth/callback/route.ts:59

public columns or explicit server query

```ts
supabase .from("profiles") .select("id") .eq("id", user.id) .maybeSingle()
```

## app/auth/callback/route.ts:69

write (review client/authorization)

```ts
adminDb.from("profiles").upsert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? null, // Google imagery remains an explicit onboarding choice. Store only the // canonical GigWay avatar URL after the user chooses/imports a photo. avatar_url: null, profile_completed: false, user_roles: [], }, { onConflict: "id", ignoreDuplicates: true })
```

## app/auth/post-login/page.tsx:20

public columns or explicit server query

```ts
supabase .from("profiles") .select("profile_completed, username") .eq("id", user.id) .maybeSingle()
```

## app/buy-connects/page.tsx:44

owner-only read

```ts
supabase .from("own_profiles") .select("connects_balance, subscription_tier") .eq("id", user.id) .single()
```

## app/dashboard/jobs/boost/page.tsx:13

owner-only read

```ts
supabase .from("own_profiles") .select("user_roles, hire_talent_type, profile_completed") .eq("id", user.id) .single()
```

## app/dashboard/page.tsx:81

owner-only read

```ts
supabase .from("own_profiles") .select("*") .eq("id", user.id) .single()
```

## app/explore/page.tsx:28

public columns or explicit server query

```ts
supabase.from("profiles") .select("id, full_name, username, avatar_url, tagline, skills, availability, is_verified, location, created_at") .eq("profile_completed", true).order("created_at", { ascending: false }).limit(24)
```

## app/explore/page.tsx:53

public columns or explicit server query

```ts
supabase.from("profiles").select("skills,location,job_function").eq("id", user!.id).maybeSingle()
```

## app/freelancers/page.tsx:29

owner-only read

```ts
supabase .from("own_profiles") .select("is_boosted, boost_expires_at, is_verified, subscription_tier, user_roles, hire_talent_type") .eq("id", user.id) .single()
```

## app/freelancers/page.tsx:54

public columns or explicit server query

```ts
directoryDb .from("profiles") .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability") .not("is_private", "is", true).not("is_banned", "is", true) .eq("profile_completed", true) .eq("is_boosted", true) .gt("boost_expires_at", now) .order("boost_expires_at", { ascending: false }) .limit(6)
```

## app/freelancers/page.tsx:69

public columns or explicit server query

```ts
directoryDb .from("profiles") .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability") .not("is_private", "is", true).not("is_banned", "is", true) .eq("profile_completed", true) .eq("plan", "find_work") .gt("plan_expires_at", now) .not("id", "in", boostedIds) .order("avg_rating", { ascending: false }) .limit(10)
```

## app/freelancers/page.tsx:85

public columns or explicit server query

```ts
directoryDb .from("profiles") .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability") .not("is_private", "is", true).not("is_banned", "is", true) .eq("profile_completed", true) .not("id", "in", planActiveIds) .order("is_verified", { ascending: false }) .order("avg_rating", { ascending: false }) .limit(44)
```

## app/freelancers/[id]/page.tsx:14

public columns or explicit server query

```ts
supabase .from("profiles") .select("full_name, tagline, skills, hourly_rate") .eq("id", id) .single()
```

## app/freelancers/[id]/page.tsx:43

public columns or explicit server query

```ts
supabase .from("profiles") .select("id,full_name,avatar_url,tagline,bio,skills,hourly_rate,availability,avg_rating,is_verified,location,created_at,portfolio_links") .eq("id", id) .single()
```

## app/freelancers/[id]/page.tsx:51

embedded relation

```ts
supabase .from("reviews") .select("*, reviewer:reviewer_id(full_name, avatar_url)") .eq("reviewee_id", id) .order("created_at", { ascending: false })
```

## app/gig-card/[username]/page.tsx:8

public columns or explicit server query

```ts
createPublicClient().from("profiles").select("full_name,username,avatar_url,tagline,skills,location") .eq("username", username.toLowerCase()).maybeSingle()
```

## app/gigs/new/page.tsx:11

public columns or explicit server query

```ts
supabase .from("profiles") .select("profile_completed") .eq("id", user.id) .single()
```

## app/gigs/page.tsx:25

embedded relation

```ts
supabase.from("gigs") .select("*, profiles:freelancer_id(full_name, username, avg_rating, is_verified)") .eq("status", "active") .order("is_featured", { ascending: false }) .order("orders_count", { ascending: false }) .order("created_at", { ascending: false }) .order("id", { ascending: false }) .limit(51)
```

## app/gigs/page.tsx:43

owner-only read

```ts
supabase .from("own_profiles") .select("user_roles, find_work_type") .eq("id", user.id) .single()
```

## app/gigs/[id]/page.tsx:27

embedded relation

```ts
supabase .from("gigs") .select("*, profiles:freelancer_id(id, full_name, username, avg_rating, bio, tagline, is_verified, skills, avatar_url)") .eq("id", id) .single()
```

## app/gigs/[id]/page.tsx:37

embedded relation

```ts
supabase .from("reviews") .select("*, reviewer:reviewer_id(full_name)") .eq("reviewee_id", gig.freelancer_id) .order("created_at", { ascending: false }) .limit(5)
```

## app/gigs/[id]/page.tsx:44

embedded relation

```ts
supabase .from("gigs") .select("*, profiles:freelancer_id(full_name, username, avg_rating, is_verified)") .eq("freelancer_id", gig.freelancer_id) .eq("status", "active") .neq("id", id) .limit(3)
```

## app/home/page.tsx:23

public columns or explicit server query

```ts
db.from("profiles").select("full_name,username,avatar_url,tagline,bio,skills,location,job_function,portfolio_links,experience_description").eq("id", userId).maybeSingle()
```

## app/jobs/new/page.tsx:12

public columns or explicit server query

```ts
supabase .from("profiles") .select("profile_completed") .eq("id", user.id) .single()
```

## app/jobs/page.tsx:25

embedded relation

```ts
supabase.from("jobs") .select("id, title, company_name, location, job_type, salary_min, salary_max, skills_required, experience_required, created_at, is_featured, featured_until, client_id, profiles:client_id(is_verified)") .eq("status", "active") .order("is_featured", { ascending: false }) .order("created_at", { ascending: false }) .order("id", { ascending: false }) .limit(51)
```

## app/jobs/page.tsx:46

owner-only read

```ts
supabase .from("own_profiles") .select("user_roles, hire_talent_type, find_work_type") .eq("id", user.id) .single()
```

## app/jobs/[id]/page.tsx:47

embedded relation

```ts
supabase .from("jobs") .select("*, profiles:client_id(id, full_name, company, avatar_url, is_verified)") .eq("id", id) .single()
```

## app/messages/page.tsx:31

public columns or explicit server query

```ts
supabase.from("profiles").select("id,full_name,username,avatar_url").in("id", ids)
```

## app/messages/[userId]/page.tsx:60

public columns or explicit server query

```ts
supabase .from("profiles").select("id, full_name, username, avatar_url").eq("id", resolvedId).single()
```

## app/organizations/[username]/team/page.tsx:18

embedded relation

```ts
db.from("organization_members").select("id,member_role,status,profiles(full_name,username)") .eq("organization_id", org.data.id).order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * 25, page * 25)
```

## app/page.tsx:22

public columns or explicit server query

```ts
db.from("profiles").select("id", { count: "exact", head: true }).eq("profile_completed", true)
```

## app/page.tsx:33

embedded relation

```ts
db.from("gigs").select("id,title,price,delivery_days,image_url,category,profiles:freelancer_id(full_name,avg_rating,is_verified)").eq("status", "active").order("orders_count", { ascending: false }).limit(6)
```

## app/profile/complete/page.tsx:16

owner-only read

```ts
supabase .from("own_profiles") .select("profile_completed, username, full_name, avatar_url, tagline, location, skills, user_roles, find_work_type, hire_talent_type, account_type") .eq("id", user.id) .maybeSingle()
```

## app/profile/edit/page.tsx:15

owner-only read

```ts
supabase .from("own_profiles") .select("*") .eq("id", user.id) .maybeSingle()
```

## app/profile/page.tsx:13

public columns or explicit server query

```ts
db.from("profiles").select("full_name,username,avatar_url").eq("id", user.id).maybeSingle()
```

## app/projects/page.tsx:29

public columns or explicit server query

```ts
supabase.from("profiles").select("skills").eq("id", user.id).single()
```

## app/projects/[id]/page.tsx:95

embedded relation

```ts
supabase .from("proposals") .select("freelancer_id, profiles:freelancer_id(full_name)") .eq("project_id", id) .eq("status", "accepted") .single()
```

## app/projects/[id]/proposals/page.tsx:61

embedded relation

```ts
supabase .from("proposals") .select("*, profiles:freelancer_id(full_name, avatar_url, tagline, avg_rating)") .eq("project_id", projectId) .order("created_at", { ascending: false })
```

## app/saved/page.tsx:32

public columns or explicit server query

```ts
supabase .from("profiles") .select("id, full_name, tagline, avg_rating") .in("id", savedFreelancers.map(s => s.item_id))
```

## app/sitemap.ts:22

public columns or explicit server query

```ts
supabase .from("profiles") .select("id, updated_at") .eq("profile_completed", true) .limit(500)
```

## app/social/create/page.tsx:11

public columns or explicit server query

```ts
withDeadline(db.from("profiles") .select("id,full_name,avatar_url").eq("id", user.id).maybeSingle(), AUTH_CHECK_TIMEOUT_MS)
```

## app/social/explore/page.tsx:23

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url,tagline").eq("profile_completed", true).order("created_at", { ascending: false }).limit(12)
```

## app/social/glimps/create/page.tsx:11

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,avatar_url").eq("id", user.id).maybeSingle()
```

## app/social/posts/[id]/page.tsx:25

public columns or explicit server query

```ts
db.from("profiles").select("full_name").eq("id", post.author_profile_id).maybeSingle()
```

## app/social/vijox/create/page.tsx:11

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,avatar_url").eq("id", user.id).maybeSingle()
```

## app/tools/opportunity-match/page.tsx:5

public columns or explicit server query

```ts
db.from("profiles").select("tagline,skills,experience_years").eq("id",user.id).maybeSingle()
```

## app/u/[username]/page.tsx:66

public columns or explicit server query

```ts
supabase .from("profiles") .select("id,full_name,username,avatar_url,bio,location,tagline,skills,job_function,portfolio_links,hourly_rate,experience_years,experience_description,is_verified") .eq("username", username.toLowerCase()) .maybeSingle()
```

## app/u/[username]/page.tsx:85

public columns or explicit server query

```ts
sessionDb.from("profiles").select("id,full_name,username,avatar_url,bio,location,tagline,skills,job_function,portfolio_links,hourly_rate,experience_years,experience_description,is_verified").eq("username", username.toLowerCase()).maybeSingle()
```

## app/u/[username]/[list]/page.tsx:6

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username").eq("username",username.toLowerCase()).maybeSingle()
```

## app/u/[username]/[list]/page.tsx:6

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url,tagline,is_verified").in("id",ids)
```

## app/verify/page.tsx:28

owner-only read

```ts
supabase .from("own_profiles") .select("verification_status,verification_paid_at,account_type,full_name,hire_talent_type,find_work_type,user_roles") .eq("id", user.id) .single()
```

## app/verify-me/page.tsx:20

owner-only read

```ts
supabase .from("own_profiles") .select("verification_status, verification_paid_at, is_verified") .eq("id", user.id) .single()
```

## lib/auth/browser-ui.ts:18

public columns or explicit server query

```ts
withDeadline(db.from("profiles").select("full_name,username,avatar_url").eq("id", user.id).maybeSingle())
```

## lib/billing/entitlements.ts:12

public columns or explicit server query

```ts
db.from("profiles").select("is_verified").eq("id", userId).maybeSingle()
```

## lib/billing/entitlements.ts:34

write (review client/authorization)

```ts
db.from("profiles").update({ verification_paid_at: now.toISOString() }).eq("id", args.userId)
```

## lib/billing/limits.ts:22

public columns or explicit server query

```ts
db.from("profiles").select("portfolio_links").eq("id", userId).maybeSingle()
```

## lib/jobs/server.ts:5

public columns or explicit server query

```ts
socialDb().from("profiles").select("id").eq("id", userId).maybeSingle()
```

## lib/network/discovery.ts:8

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url,tagline,skills").eq("profile_completed", true).neq("id", viewerId)
```

## lib/organizations/public.ts:33

embedded relation

```ts
db.from("organization_members") .select("profile_id,person:profiles!profile_id!inner(id)", { count: "exact", head: true }) .eq("organization_id", id).eq("status", "active") .not("person.username", "is", null) .or("is_private.eq.false,is_private.is.null", { referencedTable: "person" })
```

## lib/organizations/public.ts:49

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url,tagline") .in("id", members.map(row => row.profile_id)).not("username", "is", null) .or("is_private.eq.false,is_private.is.null")
```

## lib/social/server.ts:35

public columns or explicit server query

```ts
socialDb().from("profiles").select("id,full_name,username,avatar_url,tagline,is_verified").eq("id", userId).maybeSingle()
```

## lib/social/server.ts:80

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url,tagline,is_verified").in("id",profileIds)
```

## lib/social/server.ts:92

public columns or explicit server query

```ts
db.from("profiles").select("username").in("username",mentionNames).eq("profile_completed",true)
```

## lib/social/server.ts:143

public columns or explicit server query

```ts
db.from("profiles").select("id,full_name,username,avatar_url,is_verified").in("id",userIds)
```

## lib/supabase/mutation-guard.ts:11

owner-only read

```ts
db.from("own_profiles").select("is_banned").eq("id", result.data.user.id).maybeSingle()
```

## lib/supabase/mutation-guard.ts:28

owner-only read

```ts
db.from("own_profiles").select("is_banned").eq("id", user.id).maybeSingle()
```

## components/freelancers/FreelancersClient.tsx:57

public columns or explicit server query

```ts
supabase .from("profiles") .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability") .eq("profile_completed", true)
```

## components/gigs/GigsClient.tsx:56

embedded relation

```ts
supabase .from("gigs") .select("*, profiles:freelancer_id(full_name, username, avg_rating, is_verified)") .eq("status", "active")
```

## components/home/FeaturedFreelancers.tsx:8

public columns or explicit server query

```ts
supabase .from("profiles") .select("id, username, full_name, avatar_url, tagline, skills, is_verified, avg_rating, hourly_rate") .eq("is_verified", true) .eq("profile_completed", true) .order("avg_rating", { ascending: false }) .limit(6)
```

## components/home/IdentityCompletionPrompt.tsx:20

public columns or explicit server query

```ts
db.from("profiles").select("full_name,username,avatar_url,tagline,bio,skills,job_function,portfolio_links,experience_description").eq("id", userId).maybeSingle()
```

## components/home/TrustVerification.tsx:13

public columns or explicit server query

```ts
supabase .from("profiles") .select("id", { count: "exact", head: true }) .eq("is_verified", true)
```

## components/jobs/JobsClient.tsx:95

embedded relation

```ts
supabase .from("jobs") .select("id, title, company_name, location, job_type, salary_min, salary_max, skills_required, experience_required, created_at, is_featured, featured_until, client_id, profiles:client_id(is_verified)") .eq("status", "active") .order("is_featured", { ascending: false }) .order("created_at", { ascending: false })
```

## components/layout/Navbar.tsx:123

owner-only read

```ts
supabase.from("own_profiles") .select("full_name,avatar_url,user_roles,find_work_type,hire_talent_type,verification_status,profile_completed") .eq("id", user.id).single() .then(({ data }) => setProfile(data))
```

## components/onboarding/page.tsx:13

public columns or explicit server query

```ts
supabase .from("profiles") .select("profile_completed") .eq("id", user.id) .single()
```

## components/projects/new/page.tsx:13

public columns or explicit server query

```ts
supabase .from("profiles") .select("profile_completed") .eq("id", user.id) .single()
```

## components/projects/page.tsx:16

embedded relation

```ts
supabase .from("projects") .select("*, profiles!projects_client_id_fkey(username, full_name)") .eq("status", "open")
```
