import { normalizeUsername, usernameError } from "@/lib/identity"

export const INDUSTRIES = ["Technology", "IT", "Marketing Agency", "Advertising & Marketing", "Finance & Banking", "Healthcare", "Education", "E-commerce", "Manufacturing", "Real Estate", "Media & Entertainment", "Consulting", "Retail", "Logistics", "Agriculture", "Travel & Tourism", "Nonprofit", "Professional Services", "Construction", "Energy", "Other"]
export const WORKPLACE_SIZES = ["1", "2-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"]
// Suggestions only. Existing strings (including casing) are never normalized.
export const COUNTRIES = ["India", "Singapore", "United States", "United Kingdom", "Canada", "Australia", "United Arab Emirates", "Germany", "France", "Netherlands", "Japan", "China", "South Korea", "Indonesia", "Malaysia", "Philippines", "Thailand", "Vietnam", "Bangladesh", "Pakistan", "Sri Lanka", "Nepal", "New Zealand", "South Africa", "Nigeria", "Kenya", "Brazil", "Mexico", "Saudi Arabia", "Qatar", "Italy", "Spain", "Sweden", "Switzerland", "Ireland"]
export function compatibleOptions(options: string[], current: string) {
  return current && !options.includes(current) ? [current, ...options] : options
}
export const SETUP_FIELDS = ["name", "username", "entity_type", "logo_url", "cover_url", "tagline", "description", "website", "industry", "company_size", "founded_year", "location", "country"] as const
export type SetupData = Record<typeof SETUP_FIELDS[number], string>
export function setupData(organization?: Record<string, unknown>): SetupData {
  return Object.fromEntries(SETUP_FIELDS.map(key => [key, String(organization?.[key] ?? (key === "entity_type" ? "organization" : ""))])) as SetupData
}
export function setupErrors(data: SetupData) {
  const errors: Partial<Record<keyof SetupData, string>> = {}
  if (!data.name.trim()) errors.name = "Add your Workplace name."
  const invalid = usernameError(normalizeUsername(data.username))
  if (invalid) errors.username = invalid
  if (data.website.trim()) {
    try {
      const url = new URL(data.website.trim())
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw Error()
    } catch { errors.website = "Enter a full website address, such as https://example.com." }
  }
  if (data.founded_year && (!/^\d{1,4}$/.test(data.founded_year) || Number(data.founded_year) < 1 || Number(data.founded_year) > new Date().getFullYear())) errors.founded_year = "Enter a valid founding year, no later than this year."
  return errors
}
export const COMPLETENESS_FIELDS = [
  ["name", "Add a Workplace name"], ["username", "Choose a username"],
  ["logo_url", "Add a logo"], ["cover_url", "Add a cover"], ["tagline", "Add a tagline"],
  ["description", "Tell people about your Workplace"], ["industry", "Add an industry"],
  ["website", "Add your website"], ["location", "Add a location"],
] as const
export function workplaceCompleteness(data: SetupData) {
  const invalid = setupErrors(data)
  const missing = COMPLETENESS_FIELDS.filter(([key]) => !data[key].trim() || invalid[key])
  return { missing, complete: COMPLETENESS_FIELDS.length - missing.length, total: COMPLETENESS_FIELDS.length, percent: Math.round((COMPLETENESS_FIELDS.length - missing.length) / COMPLETENESS_FIELDS.length * 100) }
}
