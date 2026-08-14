export type Product = { key: "pro_monthly" | "pro_annual" | "business_monthly" | "business_annual" | "verified"; tier: "pro" | "business" | "verified"; amountPaise: number; durationDays: number | null; kind: "prepaid_access" | "verification"; label: string }
export const PRODUCTS: Record<Product["key"], Product> = {
  pro_monthly: { key: "pro_monthly", tier: "pro", amountPaise: 14900, durationDays: 30, kind: "prepaid_access", label: "GigWay Pro Monthly" },
  pro_annual: { key: "pro_annual", tier: "pro", amountPaise: 99900, durationDays: 365, kind: "prepaid_access", label: "GigWay Pro Annual" },
  business_monthly: { key: "business_monthly", tier: "business", amountPaise: 39900, durationDays: 30, kind: "prepaid_access", label: "GigWay Business Monthly" },
  business_annual: { key: "business_annual", tier: "business", amountPaise: 299900, durationDays: 365, kind: "prepaid_access", label: "GigWay Business Annual" },
  verified: { key: "verified", tier: "verified", amountPaise: 29900, durationDays: null, kind: "verification", label: "GigWay Verified" },
}
export function getProduct(key: unknown): Product | null { return typeof key === "string" && key in PRODUCTS ? PRODUCTS[key as Product["key"]] : null }
export const RATE_CARD = {
  free: ["Professional profile and discovery", "2 job applications/month", "1 project proposal/month", "1 active service, 2 portfolio items, 3 saved opportunities", "1 active job and 1 active project"],
  pro: ["50 job applications/month", "30 project proposals/month", "Up to 10 active services", "Up to 20 portfolio items", "Unlimited saved opportunities"],
  business: ["Up to 10 active jobs", "Up to 10 active projects", "Hiring-focused access"],
} as const
export const displayPrice = (product: Product) => `₹${(product.amountPaise / 100).toLocaleString("en-IN")}`
