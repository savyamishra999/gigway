"use client";

import VijoxExperience, { type VijoxExperienceProps } from "@/components/social/VijoxExperience";

export default function VijoxPlayer(props: VijoxExperienceProps) {
  return <div className="mt-4"><VijoxExperience {...props} compact /></div>;
}
