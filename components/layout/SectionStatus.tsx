
export function SectionLoading({ label = "Loading this section…" }: { label?: string }) {
  return <p role="status" className="px-4 py-6 text-sm text-brand-slate">{label}</p>
}

export function SectionUnavailable({ href, label = "This section could not be loaded." }: { href: string; label?: string }) {
  return <div role="alert" className="px-4 py-6 text-sm text-brand-slate"><p>{label}</p><a href={href} className="mt-2 inline-block font-semibold text-brand-indigo">Try again</a></div>
}
