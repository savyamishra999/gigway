// A copy hint, never a validation or authorization rule.
export function looksLikeCompanyName(name: string) {
  return /\b(?:pvt\.?\s*ltd\.?|private\s+limited|llp|technologies|solutions|foundation|institute|company|startup)\b/i.test(name)
}
