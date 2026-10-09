const assert = require('node:assert/strict')
const fs = require('node:fs')

let passed = 0
function source(path) { return fs.readFileSync(path, 'utf8') }
function check(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`) }

check('public header uses Tagline and keeps Bio in About', () => {
  const page = source('app/u/[username]/page.tsx')
  assert.match(page, /profile\.tagline && <p/)
  assert.doesNotMatch(page, /profile\.bio \|\| profile\.tagline/)
  assert.match(page, /profile\.bio &&[\s\S]*>About</)
  assert.match(page, /rounded-full bg/)
})

check('public profile keeps relationship actions and hides completion UI', () => {
  const page = source('app/u/[username]/page.tsx')
  assert.match(page, /ProfileConnectionActions/)
  assert.match(page, /> Message</)
  assert.match(page, /Edit Professional Identity/)
  assert.doesNotMatch(page, /professionalMilestones|67% complete|Profile incomplete/)
})

check('intents are additive and visually bounded', () => {
  const page = source('app/u/[username]/page.tsx')
  assert.match(page, /modes\.slice\(0, 2\)/)
  assert.match(page, /modes\.length - 2/)
})

check('Work preview is deferred, bounded, and uses canonical routes', () => {
  const page = source('app/u/[username]/page.tsx')
  const work = source('components/profile/ProfileWorkPreview.tsx')
  assert.match(page, /workPreview=\{<Suspense[\s\S]*<ProfileWorkPreview/)
  assert.match(work, /Promise\.all/)
  assert.equal((work.match(/\.limit\(6\)/g) || []).length, 3)
  assert.match(work, /\.slice\(0, 6\)/)
  assert.match(work, /Services Offered/)
  assert.match(work, /Jobs Posted/)
  assert.match(work, /Projects Posted/)
  assert.doesNotMatch(work, />Completed Work<|>Work Proof</i)
  for (const route of ['/gigs/new', '/jobs/new', '/projects/new']) assert.ok(work.includes(route))
})

check('completion is actual milestones with a next action and no percentage', () => {
  const prompt = source('components/home/IdentityCompletionPrompt.tsx')
  const model = source('lib/identity/profile-strength.ts')
  assert.doesNotMatch(prompt + model, /67%|percentage|percent/)
  assert.match(prompt, /Next recommended action/)
  assert.match(prompt, /professional milestones added/)
  assert.doesNotMatch(prompt, /organization_members|from\("gigs"\)/)
  for (const signal of ['avatar_url', 'tagline', 'bio', 'skills', 'portfolio_links', 'hasIntent']) assert.ok(model.includes(signal))
})

check('phone is optional but validated when supplied', () => {
  const form = source('components/profile/EditProfileForm.tsx')
  assert.doesNotMatch(form, /Phone number is required/)
  assert.match(form, /formData\.phone\.trim\(\) && !validatePhone/)
})

check('edit groups are simplified and deep-linkable', () => {
  const form = source('components/profile/EditProfileForm.tsx')
  assert.match(form, /\["Identity", "About", "Professional", "Work", "Links", "Account"\]/)
  assert.match(form, /initialSection/)
  assert.doesNotMatch(form, /const TABS = \["Profile"/)
})

check('profile update endpoint filters writable columns', () => {
  const route = source('app/api/profile/route.ts')
  assert.match(route, /const updates = ownerProfileUpdates\(body\)/)
  const fields = source('lib/profile/fields.ts')
  assert.match(fields, /new Set<string>\(OWNER_EDITABLE_PROFILE_FIELDS\)/)
  assert.match(fields, /Object\.entries\(body\)\.filter/)
  assert.match(route, /typeof updates\.phone === "string" && updates\.phone\.trim\(\)/)
  assert.match(route, /digits\.length !== 10 && digits\.length !== 12/)
  assert.match(route, /\.update\(updates\)\.eq\("id", user\.id\)/)
})

check('current profile tabs have Work; dormant direct routes remain independent', () => {
  const feed = source('components/social/ProfileSocialFeed.tsx'), tabs = source('lib/profile/tabs.ts')
  for (const label of ['GigThoughts', 'Work', 'Reposts']) assert.ok(tabs.includes(label))
  assert.match(feed, /isOwner && createHref/)
  assert.doesNotMatch(feed, /GlimpsExperience|vijox|glimps|JOX/)
  for (const route of ['app/social/vijox/create/page.tsx', 'app/social/glimps/create/page.tsx']) assert.ok(fs.existsSync(route))
})

console.log(`${passed} Professional Identity implementation checks passed.`)
