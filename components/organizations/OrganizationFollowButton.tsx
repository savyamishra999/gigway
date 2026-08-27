"use client";
import FollowButton from "@/components/social/FollowButton";
export default function OrganizationFollowButton({ organizationId, initialFollowing }: { organizationId: string; initialFollowing: boolean }) { return <FollowButton targetType="organization" targetId={organizationId} initialFollowing={initialFollowing} label="organization" className="rounded-xl bg-brand-indigo px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-indigoDark disabled:opacity-60"/>; }
