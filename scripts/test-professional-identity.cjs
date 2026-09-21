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
  assert.match(page, /<Suspense fallback=\{null\}><ProfileWorkPreview/)
  assert.match(work, /Promise\.all/)
  assert.equal((work.match(/\.limit\(2\)/g) || []).length, 3)
  assert.match(work, /\.slice\(0, 4\)/)
  assert.match(work, /Service offered/)
  assert.match(work, /Job posted/)
  assert.match(work, /Project posted/)
  assert.doesNotMatch(work, /completed work|work proof/i)
  for (const route of ['/gigs/', '/jobs/', '/projects/']) assert.ok(work.includes(route))
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
  assert.match(route, /const allowed = new Set/)
  assert.match(route, /Object\.entries\(body\)\.filter/)
  assert.match(route, /typeof updates\.phone === "string" && updates\.phone\.trim\(\)/)
  assert.match(route, /digits\.length !== 10 && digits\.length !== 12/)
  assert.match(route, /\.update\(updates\)\.eq\("id", user\.id\)/)
})

check('social identity tabs remain available', () => {
  const feed = source('components/social/ProfileSocialFeed.tsx')
  for (const label of ['GigThoughts', 'JOX', 'GLIMPS', 'Reposts']) assert.ok(feed.includes(label))
  assert.match(feed, /isOwner && createHref\[tab\]/)
  assert.match(feed, /\/social\/vijox\/create/)
  assert.match(feed, /\/social\/glimps\/create/)
})

console.log(`${passed} Professional Identity implementation checks passed.`)
