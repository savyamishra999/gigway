// Recovery ceilings, not performance targets. Allow slow mobile requests a full
// minute; multi-request operations get two minutes before offering a retry.
export const REQUEST_TIMEOUT_MS = 60_000
export const OPERATION_TIMEOUT_MS = 120_000

export async function withDeadline<T>(operation: PromiseLike<T>, ms = OPERATION_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("The request took too long. Please try again.")), ms)
      }),
    ])
  } finally { clearTimeout(timer) }
}

// Supabase's JSON transport and small application API responses. Keep the abort
// signal alive through body consumption, not just until response headers arrive.
export async function boundedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = typeof Request !== "undefined" && input instanceof Request ? input : undefined
  const method = (init?.method || request?.method || "GET").toUpperCase()
  const headers = new Headers(init?.headers || request?.headers)
  const url = request?.url || String(input)
  // Large media uploads have their own progress/recovery UI; this boot deadline
  // must not cut off valid slow uploads.
  if (!["GET", "HEAD"].includes(method) && !headers.get("content-type")?.includes("json") && !url.includes("/auth/v1/")) return fetch(input, init)
  const controller = new AbortController()
  const upstream = init?.signal ?? (typeof Request !== "undefined" && input instanceof Request ? input.signal : undefined)
  const abort = () => controller.abort(upstream?.reason)
  if (upstream?.aborted) abort()
  else upstream?.addEventListener("abort", abort, { once: true })
  const timer = setTimeout(() => controller.abort(new Error("Request timed out")), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    if (!response.headers.get("content-type")?.includes("json")) return response
    const body = await response.text()
    return new Response([204, 205, 304].includes(response.status) ? null : body, { status: response.status, statusText: response.statusText, headers: response.headers })
  } finally {
    clearTimeout(timer)
    upstream?.removeEventListener("abort", abort)
  }
}
