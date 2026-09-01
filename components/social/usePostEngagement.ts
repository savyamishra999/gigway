"use client";

import { useEffect, useRef, useState } from "react";

export function usePostLike(postId: string, initialLiked: boolean, initialCount: number, onError?: (message: string) => void) {
  const [liked, setLiked] = useState(initialLiked), [count, setCount] = useState(initialCount);
  const committed = useRef(initialLiked), desired = useRef(initialLiked), baseCount = useRef(initialCount), running = useRef(false);
  const present = () => { setLiked(desired.current); setCount(Math.max(0, baseCount.current + (desired.current === committed.current ? 0 : desired.current ? 1 : -1))); };
  useEffect(() => { if (!running.current) { committed.current = initialLiked; desired.current = initialLiked; baseCount.current = initialCount; setLiked(initialLiked); setCount(initialCount); } }, [initialLiked, initialCount]);
  const flush = async () => { if (running.current) return; running.current = true; try { while (committed.current !== desired.current) { const before = committed.current, target = desired.current; const response = await fetch(`/api/social/posts/${postId}/like`, { method: target ? "POST" : "DELETE" }); if (!response.ok) { desired.current = committed.current; present(); onError?.("Could not update like."); break; } committed.current = target; baseCount.current = Math.max(0, baseCount.current + (target === before ? 0 : target ? 1 : -1)); present(); } } finally { running.current = false; if (committed.current !== desired.current) void flush(); } };
  const toggleLike = () => { desired.current = !desired.current; present(); void flush(); };
  return { liked, likeCount: count, toggleLike };
}
