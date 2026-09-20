"use client"

export default function RequestFailure({ message = "This page could not be loaded. Check your connection and try again." }: { message?: string }) {
  return <section role="alert" className="mx-auto max-w-xl px-4 py-10"><p>{message}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-brand-indigo px-4 py-2 font-semibold text-white">Try again</button></section>
}
