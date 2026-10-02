"use client";
import { useEffect, useState } from "react";
import { contentTimestamp, formatContentAge, formatContentDate } from "@/lib/content-time";

export default function ContentTimestamp({ createdAt, updatedAt, exact = false, className }: {
  createdAt?: string | null; updatedAt?: string | null; exact?: boolean; className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { if (!exact) setNow(Date.now()); }, [createdAt, updatedAt, exact]);
  const timestamp = contentTimestamp(createdAt, updatedAt);
  if (!timestamp) return null;
  const date = formatContentDate(timestamp.value)!;
  // SSR and first hydration render use the stored date, never separate clocks.
  const display = exact || now === null ? date : formatContentAge(timestamp.value, now);
  return <time dateTime={timestamp.value} title={`${timestamp.label} ${date}`} className={className}>{timestamp.label} {display}</time>;
}
