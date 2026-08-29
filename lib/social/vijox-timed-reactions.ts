export const VIJOX_REACTION_TYPES = ["love", "applause", "insight", "fire"] as const;
export type VijoxTimedReactionType = (typeof VIJOX_REACTION_TYPES)[number];

export type VijoxTimedReactionSummary = {
  total: number;
  counts: Record<VijoxTimedReactionType, number>;
  moments: Array<{
    timestampMs: number;
    counts: Partial<Record<VijoxTimedReactionType, number>>;
    total: number;
  }>;
  viewerReactions: Array<{ reactionType: VijoxTimedReactionType; timestampMs: number }>;
  mostReactedMoment: { timestampMs: number; total: number } | null;
};

export type VijoxTimedReactionRow = {
  post_id: string;
  reactor_user_id: string;
  reaction_type: VijoxTimedReactionType;
  time_bucket_ms: number;
};

const emptyCounts = (): Record<VijoxTimedReactionType, number> => ({ love: 0, applause: 0, insight: 0, fire: 0 });

export function zeroVijoxTimedReactionSummary(): VijoxTimedReactionSummary {
  return { total: 0, counts: emptyCounts(), moments: [], viewerReactions: [], mostReactedMoment: null };
}

export function aggregateVijoxTimedReactions(rows: VijoxTimedReactionRow[], viewerUserId?: string | null) {
  const summaries = new Map<string, VijoxTimedReactionSummary>();
  const moments = new Map<string, Map<number, { counts: Record<VijoxTimedReactionType, number>; total: number }>>();
  for (const row of rows) {
    if (!VIJOX_REACTION_TYPES.includes(row.reaction_type) || !Number.isSafeInteger(row.time_bucket_ms)) continue;
    const summary = summaries.get(row.post_id) || zeroVijoxTimedReactionSummary();
    summary.total += 1;
    summary.counts[row.reaction_type] += 1;
    if (viewerUserId && row.reactor_user_id === viewerUserId) summary.viewerReactions.push({ reactionType: row.reaction_type, timestampMs: row.time_bucket_ms });
    const postMoments = moments.get(row.post_id) || new Map();
    const moment = postMoments.get(row.time_bucket_ms) || { counts: emptyCounts(), total: 0 };
    moment.counts[row.reaction_type] += 1;
    moment.total += 1;
    postMoments.set(row.time_bucket_ms, moment);
    moments.set(row.post_id, postMoments);
    summaries.set(row.post_id, summary);
  }
  for (const [postId, summary] of summaries) {
    summary.moments = [...(moments.get(postId) || new Map()).entries()].sort(([a], [b]) => a - b).map(([timestampMs, moment]) => ({ timestampMs, counts: moment.counts, total: moment.total }));
    summary.mostReactedMoment = summary.moments.reduce<{ timestampMs: number; total: number } | null>((best, moment) => !best || moment.total > best.total ? { timestampMs: moment.timestampMs, total: moment.total } : best, null);
  }
  return summaries;
}
