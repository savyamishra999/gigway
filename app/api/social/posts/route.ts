import { NextRequest, NextResponse } from "next/server";
import { canViewPost, plainText, requireSocialUser, resolveProfile, safePost, socialDb, withReplyPreviews } from "@/lib/social/server";

const PAGE_SIZE = 15;
const FETCH_SIZE = PAGE_SIZE * 4 + 1;
const MAX_OWN_REPOSTS_PER_PAGE = 3;
const POST_FIELDS = "id,author_user_id,author_profile_id,author_organization_id,body,post_type,visibility,status,created_at,edited_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Activity = {
  type: "post" | "repost";
  key: string;
  time: string;
  post: any;
  actor?: { id: string; full_name: string | null; username: string | null; avatar_url: string | null };
};
type FeedCursor = { time: string; key: string };

function logFeedFailure(stage: string, error: unknown) {
  const detail = error && typeof error === "object" ? error as { stage?: unknown; code?: unknown; message?: unknown } : {};
  const code = typeof detail.code === "string" ? detail.code : undefined;
  const message = typeof detail.message === "string" ? detail.message : undefined;
  console.error("social_feed_failure", { stage: typeof detail.stage === "string" ? detail.stage : stage, code, missingEnv: code === "missing_env" ? message : undefined, message: code === "missing_env" ? undefined : message });
}

function readCursor(value: string | null): FeedCursor | null {
  if (!value) return null;
  try {
    const cursor = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof cursor.time !== "string" || Number.isNaN(new Date(cursor.time).valueOf()) || typeof cursor.key !== "string") throw Error();
    const parts = cursor.key.split(":");
    if ((parts[0] !== "post" || parts.length !== 2 || !UUID.test(parts[1])) && (parts[0] !== "repost" || parts.length !== 3 || !UUID.test(parts[1]) || !UUID.test(parts[2]))) throw Error();
    return cursor;
  } catch {
    return null;
  }
}

function isAfterCursor(activity: Activity, cursor: FeedCursor | null) {
  return !cursor || activity.time < cursor.time || (activity.time === cursor.time && activity.key < cursor.key);
}

function encodeCursor(activity: Activity) {
  return Buffer.from(JSON.stringify({ time: activity.time, key: activity.key })).toString("base64url");
}

export async function POST(req: NextRequest) {
  const user = await requireSocialUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const body = typeof b.body === "string" ? plainText(b.body, 5000, 0) : null;
  const visibility = b.visibility === "followers" ? "followers" : b.visibility === "public" ? "public" : null;
  const draft = b.draft === true;
  if (body === null || !visibility || (!body && !draft)) return NextResponse.json({ error: "Enter a plain-text post of up to 5,000 characters." }, { status: 400 });

  const db = socialDb();
  let author_profile_id: string | null = null;
  let author_organization_id: string | null = null;
  if (typeof b.organizationId === "string") {
    const profile = await resolveProfile(user.id);
    const { data: membership } = profile ? await db.from("organization_members").select("member_role").eq("organization_id", b.organizationId).eq("profile_id", profile.id).eq("status", "active").maybeSingle() : { data: null };
    if (!membership || !["owner", "admin"].includes(membership.member_role)) return NextResponse.json({ error: "You are not authorized to post for this organization." }, { status: 403 });
    author_organization_id = b.organizationId;
  } else {
    const profile = await resolveProfile(user.id);
    if (!profile || !profile.full_name?.trim() || !profile.username) return NextResponse.json({ error: "Complete your minimum GigWay identity before posting." }, { status: 403 });
    const { data: readiness } = await db.from("profiles").select("profile_completed").eq("id", user.id).maybeSingle();
    if (!readiness?.profile_completed) return NextResponse.json({ error: "Complete your minimum GigWay identity before posting." }, { status: 403 });
    author_profile_id = profile.id;
  }
  const { data, error } = await db.from("posts").insert({ author_user_id: user.id, author_profile_id, author_organization_id, post_type: "text", body: body || null, visibility, status: draft ? "hidden" : "published" }).select(POST_FIELDS).single();
  if (error || !data) return NextResponse.json({ error: "We could not publish your post." }, { status: 503 });
  const mentions = [...new Set((body || "").match(/(^|\s)@([a-zA-Z0-9_]{1,32})/g)?.map((x) => x.trim().slice(1).toLowerCase()) || [])].slice(0, 5);
  if (mentions.length) {
    const { data: recipients } = await db.from("profiles").select("id,username").in("username", mentions);
    const actor = author_organization_id ? (await db.from("organizations").select("name").eq("id", author_organization_id).maybeSingle()).data?.name : (await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle()).data?.full_name;
    const rows = (recipients || []).filter((profile) => profile.id !== user.id).map((profile) => ({ user_id: profile.id, type: "social_mention", title: "You were mentioned in a post", body: `${actor || "Someone"} mentioned you in a post`, link: `/social/posts/${data.id}` }));
    if (rows.length) await db.from("notifications").insert(rows);
  }
  return NextResponse.json({ post: await safePost(data, user.id) }, { status: 201 });
}

export async function GET(req: NextRequest) {
  let stage = "auth";
  try {
    const viewer = await requireSocialUser();
    const feed = req.nextUrl.searchParams.get("feed") || "discover";
    if (feed !== "discover" && feed !== "following") return NextResponse.json({ error: "Invalid feed." }, { status: 400 });
    const cursorValue = req.nextUrl.searchParams.get("cursor");
    const db = socialDb();

    if (feed === "discover") {
      let query = db.from("posts").select(POST_FIELDS).eq("status", "published").order("created_at", { ascending: false }).order("id", { ascending: false }).limit(PAGE_SIZE + 1);
      if (cursorValue) {
        const [createdAt, id] = cursorValue.split("|");
        if (!createdAt || !id) return NextResponse.json({ error: "Invalid cursor." }, { status: 400 });
        query = query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`);
      }
      stage = "base_posts";
      const { data, error } = await query;
      if (error) throw error;
      const accessible = [] as any[];
      stage = "post_access";
      for (const post of data || []) if (await canViewPost(post, viewer?.id)) accessible.push(post);
      const page = accessible.slice(0, PAGE_SIZE);
      stage = "serialization";
      return NextResponse.json({ items: await withReplyPreviews(await Promise.all(page.map((post) => safePost(post, viewer?.id)))), nextCursor: accessible.length > PAGE_SIZE ? `${page.at(-1).created_at}|${page.at(-1).id}` : null });
    }

    const cursor = readCursor(cursorValue);
    if (cursorValue && !cursor) return NextResponse.json({ error: "Invalid cursor." }, { status: 400 });
    if (!viewer) return NextResponse.json({ items: [], nextCursor: null });
    stage = "relationships";
    const [profileFollows, organizationFollows] = await Promise.all([
      db.from("profile_follows").select("followed_profile_id").eq("follower_user_id", viewer.id),
      db.from("organization_follows").select("organization_id").eq("follower_user_id", viewer.id),
    ]);
    if (profileFollows.error || organizationFollows.error) throw profileFollows.error || organizationFollows.error;
    const profileIds = [...new Set((profileFollows.data || []).map((row) => row.followed_profile_id))];
    const organizationIds = [...new Set((organizationFollows.data || []).map((row) => row.organization_id))];
    const repostActorIds = [...new Set([viewer.id, ...profileIds])];
    const originalFilters = [`author_user_id.eq.${viewer.id}`, ...(profileIds.length ? [`author_profile_id.in.(${profileIds.join(",")})`] : []), ...(organizationIds.length ? [`author_organization_id.in.(${organizationIds.join(",")})`] : [])].join(",");

    let originalsQuery = db.from("posts").select(POST_FIELDS).eq("status", "published").or(originalFilters).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(FETCH_SIZE);
    let repostsQuery = db.from("post_reposts").select("post_id,user_id,created_at").in("user_id", repostActorIds).order("created_at", { ascending: false }).order("post_id", { ascending: false }).order("user_id", { ascending: false }).limit(FETCH_SIZE);
    if (cursor) {
      const [kind, first, second] = cursor.key.split(":");
      originalsQuery = kind === "post" ? originalsQuery.or(`created_at.lt.${cursor.time},and(created_at.eq.${cursor.time},id.lt.${first})`) : originalsQuery.lte("created_at", cursor.time);
      repostsQuery = kind === "repost" ? repostsQuery.or(`created_at.lt.${cursor.time},and(created_at.eq.${cursor.time},post_id.lt.${first}),and(created_at.eq.${cursor.time},post_id.eq.${first},user_id.lt.${second})`) : repostsQuery.lt("created_at", cursor.time);
    }
    stage = "activities";
    const [originalsRes, repostsRes, actorsRes] = await Promise.all([
      originalsQuery,
      repostsQuery,
      db.from("profiles").select("id,full_name,username,avatar_url").in("id", repostActorIds),
    ]);
    if (originalsRes.error || repostsRes.error || actorsRes.error) throw originalsRes.error || repostsRes.error || actorsRes.error;
    const repostRows = repostsRes.data || [];
    const repostPostIds = [...new Set(repostRows.map((row) => row.post_id))];
    const repostPosts = repostPostIds.length ? (await db.from("posts").select(POST_FIELDS).in("id", repostPostIds).eq("status", "published")).data || [] : [];
    const postsById = new Map(repostPosts.map((post) => [post.id, post]));
    const actorsById = new Map((actorsRes.data || []).map((actor) => [actor.id, actor]));
    const activities: Activity[] = [];
    for (const post of originalsRes.data || []) if (await canViewPost(post, viewer.id)) activities.push({ type: "post", key: `post:${post.id}`, time: post.created_at, post });
    for (const repost of repostRows) {
      const post = postsById.get(repost.post_id);
      const actor = actorsById.get(repost.user_id);
      if (post && actor && await canViewPost(post, viewer.id)) activities.push({ type: "repost", key: `repost:${repost.post_id}:${repost.user_id}`, time: repost.created_at, post, actor });
    }
    const ordered = activities.filter((activity) => isAfterCursor(activity, cursor)).sort((a, b) => b.time.localeCompare(a.time) || b.key.localeCompare(a.key));
    const seenPosts = new Set<string>();
    const deduped: Activity[] = [];
    let ownReposts = 0;
    for (const activity of ordered) {
      if (seenPosts.has(activity.post.id)) continue;
      if (activity.type === "repost" && activity.actor?.id === viewer.id && ownReposts >= MAX_OWN_REPOSTS_PER_PAGE) continue;
      seenPosts.add(activity.post.id);
      if (activity.type === "repost" && activity.actor?.id === viewer.id) ownReposts += 1;
      deduped.push(activity);
    }
    const page = deduped.slice(0, PAGE_SIZE);
    stage = "serialization";
    const items = await Promise.all(page.map(async (activity) => activity.type === "post" ? safePost(activity.post, viewer.id) : {
      type: "repost" as const,
      repostedAt: activity.time,
      repostActor: {
        id: activity.actor!.id,
        name: activity.actor!.id === viewer.id ? "You" : activity.actor!.full_name || "GigWay member",
        username: activity.actor!.username,
        avatar: activity.actor!.avatar_url,
        href: activity.actor!.id === viewer.id ? "/profile" : activity.actor!.username ? `/u/${activity.actor!.username}` : `/freelancers/${activity.actor!.id}`,
      },
      originalPost: await safePost(activity.post, viewer.id),
    }));
    const originals = await withReplyPreviews(items.map((item): any => "type" in item && item.type === "repost" ? item.originalPost : item));
    const enrichedItems = items.map((item, index) => "type" in item && item.type === "repost" ? { ...item, originalPost: originals[index] } : originals[index]);
    const last = page.at(-1);
    const hasMore = deduped.length > PAGE_SIZE || (originalsRes.data || []).length === FETCH_SIZE || repostRows.length === FETCH_SIZE;
    return NextResponse.json({ items: enrichedItems, nextCursor: hasMore && last ? encodeCursor(last) : null });
  } catch (error) {
    logFeedFailure(stage, error);
    return NextResponse.json({ error: "feed_unavailable" }, { status: 503 });
  }
}
