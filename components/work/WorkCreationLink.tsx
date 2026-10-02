"use client";
import Link from "next/link";
import { useAuthUi } from "@/components/layout/AuthUiProvider";

// Reuse mounted identity state. The destination owns completion/permission checks.
export default function WorkCreationLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { user } = useAuthUi();
  if (!user) return null;
  return <Link prefetch={false} href={href} className="mt-3 inline-block text-body-sm font-bold text-brand-indigo">{children}</Link>;
}
