import { Suspense, type ReactNode } from "react";
import { withDeadline } from "@/lib/async";
import { socialPerf } from "@/lib/social/server";
import { SectionUnavailable } from "@/components/layout/SectionStatus";

const labels = {
  primary: "your feed", opportunities: "opportunities", network: "your network",
  jox: "JOX", glimps: "GLIMPS", completion: "your Professional Identity", activity: "activity",
};
type Props = { name: keyof typeof labels; load: () => Promise<ReactNode> };
async function Content({ name, load }: Props) {
  const startedAt = performance.now();
  try {
    const content = await withDeadline(load());
    socialPerf(`home_${name}`, startedAt, { outcome: "settled" });
    return <div data-home-ready={name}>{content}</div>;
  } catch {
    socialPerf(`home_${name}`, startedAt, { outcome: "unavailable" });
    return <div data-home-error={name}><SectionUnavailable href="/home" label={`${labels[name].charAt(0).toUpperCase() + labels[name].slice(1)} could not be loaded.`} /></div>;
  }
}
export function HomeModule({ name, load }: Props) {
  return <section data-home-module={name} className="min-w-0 max-w-full">
    <Suspense fallback={<div role="status" className={`${name === "primary" ? "min-h-48" : "min-h-20"} py-6 text-sm text-brand-slate`}>Loading {labels[name]}…</div>}>
      <Content name={name} load={load} />
    </Suspense>
  </section>;
}
