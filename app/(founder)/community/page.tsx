 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "../_components/DashboardShell";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { avatarInitials } from "@/lib/user-display";

const NEW_MEMBERS = [
  { name: "Elena Rodriguez", role: "Fintech Consultant" },
  { name: "David Kim", role: "Product Designer" },
  { name: "Sophia Thorne", role: "Climate VC" },
] as const;

const MENTORS = [
  { name: "Liam S.", role: "SaaS GTM" },
  { name: "Anya S.", role: "Fundraising" },
] as const;

type CommunityMessageRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles:
    | {
        first_name?: string | null;
        last_name?: string | null;
        full_name?: string | null;
        avatar_url?: string | null;
      }
    | null;
};

type CommunityLikeRow = {
  message_id: string;
  user_id: string;
  created_at: string;
  profiles:
    | {
        first_name?: string | null;
        last_name?: string | null;
        full_name?: string | null;
      }
    | null;
};

type CommunityReplyRow = {
  id: string;
  message_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles:
    | {
        first_name?: string | null;
        last_name?: string | null;
        full_name?: string | null;
        avatar_url?: string | null;
      }
    | null;
};

type CurrentUserProfile = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
};

function displayNameFromProfile(
  profile:
    | {
        first_name?: string | null;
        last_name?: string | null;
        full_name?: string | null;
      }
    | null
): string {
  if (!profile) return "Community Member";
  const first = profile.first_name?.trim() ?? "";
  const last = profile.last_name?.trim() ?? "";
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  return profile.full_name?.trim() || "Community Member";
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "just now";
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} min ago`;
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))} hour${diffMs >= 2 * hour ? "s" : ""} ago`;
  return `${Math.max(1, Math.floor(diffMs / day))} day${diffMs >= 2 * day ? "s" : ""} ago`;
}

export default function CommunityPage() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("You");
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [messages, setMessages] = useState<CommunityMessageRow[]>([]);
  const [likes, setLikes] = useState<CommunityLikeRow[]>([]);
  const [repliesByMessageId, setRepliesByMessageId] = useState<Record<string, CommunityReplyRow[]>>({});
  const [replyDraftByMessageId, setReplyDraftByMessageId] = useState<Record<string, string>>({});
  const [replyOpenByMessageId, setReplyOpenByMessageId] = useState<Record<string, boolean>>({});
  const [likingMessageId, setLikingMessageId] = useState<string | null>(null);
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const focusMessageId = searchParams.get("focus");

  const recentActivities = useMemo(() => {
    if (!currentUserId) return [];
    const myMessageIds = new Set(messages.filter((m) => m.user_id === currentUserId).map((m) => m.id));
    if (!myMessageIds.size) return [];

    const likeActivities = likes
      .filter((l) => myMessageIds.has(l.message_id) && l.user_id !== currentUserId)
      .map((l) => ({
        id: `like-${l.message_id}-${l.user_id}-${l.created_at}`,
        messageId: l.message_id,
        createdAt: l.created_at,
        text: `${displayNameFromProfile(l.profiles)} liked your post`,
      }));

    const replyActivities = Object.values(repliesByMessageId)
      .flat()
      .filter((r) => myMessageIds.has(r.message_id) && r.user_id !== currentUserId)
      .map((r) => ({
        id: `reply-${r.id}`,
        messageId: r.message_id,
        createdAt: r.created_at,
        text: `${displayNameFromProfile(r.profiles)} commented on your post`,
      }));

    return [...likeActivities, ...replyActivities]
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .slice(0, 8);
  }, [currentUserId, likes, messages, repliesByMessageId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id ?? null;
      if (active) setCurrentUserId(userId);
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name, avatar_url")
          .eq("id", userId)
          .maybeSingle();
        const p = (profile ?? null) as CurrentUserProfile | null;
        const first = p?.first_name?.trim() ?? "";
        const last = p?.last_name?.trim() ?? "";
        const combined = [first, last].filter(Boolean).join(" ").trim();
        const resolvedName = combined || p?.full_name?.trim() || "You";
        if (active) {
          setCurrentUserName(resolvedName);
          setCurrentUserAvatarUrl(p?.avatar_url?.trim() || null);
        }
      }
      const { data, error } = await supabase
        .from("community_messages")
        .select(
          "id, body, created_at, user_id, profiles!community_messages_user_id_fkey(first_name, last_name, full_name, avatar_url)"
        )
        .order("created_at", { ascending: false })
        .limit(30);
      const { data: likesData } = await supabase
        .from("community_message_likes")
        .select(
          "message_id, user_id, created_at, profiles!community_message_likes_user_id_fkey(first_name, last_name, full_name)"
        );
      const { data: repliesData } = await supabase
        .from("community_message_replies")
        .select(
          "id, message_id, user_id, body, created_at, profiles!community_message_replies_user_id_fkey(first_name, last_name, full_name, avatar_url)"
        )
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        setPostError(error.message || "Could not load community posts.");
        setMessages([]);
      } else {
        setMessages((data ?? []) as CommunityMessageRow[]);
        setLikes((likesData ?? []) as CommunityLikeRow[]);
        const grouped: Record<string, CommunityReplyRow[]> = {};
        for (const raw of (repliesData ?? []) as CommunityReplyRow[]) {
          if (!grouped[raw.message_id]) grouped[raw.message_id] = [];
          grouped[raw.message_id].push(raw);
        }
        setRepliesByMessageId(grouped);
      }
      setLoadingMessages(false);
    })();

    const channel = supabase
      .channel("community-messages-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        async (payload) => {
          const insertedId = (payload.new as { id?: string } | null)?.id;
          if (!insertedId) return;
          const { data } = await supabase
            .from("community_messages")
            .select(
              "id, body, created_at, user_id, profiles!community_messages_user_id_fkey(first_name, last_name, full_name, avatar_url)"
            )
            .eq("id", insertedId)
            .maybeSingle();
          if (!data) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [data as CommunityMessageRow, ...prev].slice(0, 30);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_message_likes" },
        (payload) => {
          setLikes((prev) => {
            if (payload.eventType === "INSERT") {
              const inserted = payload.new as CommunityLikeRow;
              if (prev.some((l) => l.message_id === inserted.message_id && l.user_id === inserted.user_id)) return prev;
              return [...prev, inserted];
            }
            if (payload.eventType === "DELETE") {
              const removed = payload.old as CommunityLikeRow;
              return prev.filter(
                (l) => !(l.message_id === removed.message_id && l.user_id === removed.user_id)
              );
            }
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_message_replies" },
        async (payload) => {
          const replyId = (payload.new as { id?: string } | null)?.id;
          if (!replyId) return;
          const { data } = await supabase
            .from("community_message_replies")
            .select(
              "id, message_id, user_id, body, created_at, profiles!community_message_replies_user_id_fkey(first_name, last_name, full_name, avatar_url)"
            )
            .eq("id", replyId)
            .maybeSingle();
          if (!data) return;
          const reply = data as CommunityReplyRow;
          setRepliesByMessageId((prev) => ({
            ...prev,
            [reply.message_id]: [...(prev[reply.message_id] ?? []), reply],
          }));
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!focusMessageId || loadingMessages) return;
    const el = document.getElementById(`msg-${focusMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusMessageId, loadingMessages, messages.length]);

  async function handlePostMessage() {
    if (!currentUserId || posting) return;
    const body = composerText.trim();
    if (!body) return;
    setPostError(null);
    setPosting(true);
    const { error } = await supabase
      .from("community_messages")
      .insert({ body, user_id: currentUserId });
    if (error) {
      setPostError(error.message || "Could not post message.");
    } else {
      setComposerText("");
    }
    setPosting(false);
  }

  async function handleToggleLike(messageId: string) {
    if (!currentUserId || likingMessageId) return;
    const hasLiked = likes.some((l) => l.message_id === messageId && l.user_id === currentUserId);
    setLikingMessageId(messageId);
    if (hasLiked) {
      await supabase
        .from("community_message_likes")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("community_message_likes")
        .insert({ message_id: messageId, user_id: currentUserId });
    }
    setLikingMessageId(null);
  }

  async function handleReply(messageId: string) {
    if (!currentUserId || replyingMessageId) return;
    const body = (replyDraftByMessageId[messageId] ?? "").trim();
    if (!body) return;
    setReplyingMessageId(messageId);
    const { error } = await supabase
      .from("community_message_replies")
      .insert({ message_id: messageId, user_id: currentUserId, body });
    if (!error) {
      setReplyDraftByMessageId((prev) => ({ ...prev, [messageId]: "" }));
    }
    setReplyingMessageId(null);
  }

  return (
    <DashboardShell title="Community">
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Main feed */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-5 order-1 min-w-0">
            {/* Composer */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="flex gap-3 sm:gap-4">
                {currentUserAvatarUrl ? (
                  <img
                    src={currentUserAvatarUrl}
                    alt={currentUserName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0 bg-gray-200"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold shrink-0">
                    {avatarInitials(currentUserName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <label htmlFor="community-post" className="sr-only">
                    Share an update
                  </label>
                  <textarea
                    id="community-post"
                    rows={3}
                    placeholder="Share an Update or Ask a Question to the community..."
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none min-h-[88px]"
                  />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <button type="button" disabled className="inline-flex items-center gap-1.5 opacity-70 cursor-not-allowed touch-manipulation">
                        <span className="text-base">📷</span> Photo
                      </button>
                      <button type="button" disabled className="inline-flex items-center gap-1.5 opacity-70 cursor-not-allowed touch-manipulation">
                        <span className="text-base">▶</span> Video
                      </button>
                      <button type="button" disabled className="inline-flex items-center gap-1.5 opacity-70 cursor-not-allowed touch-manipulation">
                        <span className="text-base">📊</span> Poll
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handlePostMessage()}
                      disabled={posting || !currentUserId || !composerText.trim()}
                      className="rounded-xl px-5 py-2.5 sm:py-2 text-sm font-semibold text-white min-h-[44px] w-full sm:w-auto touch-manipulation"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                  {postError && <p className="mt-2 text-xs text-red-600">{postError}</p>}
                </div>
              </div>
            </div>

            {loadingMessages ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                Loading community posts...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                No posts yet. Be the first to share an update.
              </div>
            ) : (
              messages.map((msg) => (
                <article id={`msg-${msg.id}`} key={msg.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0">
                  <div className="p-4 flex items-start justify-between gap-2">
                    <div className="flex gap-3 min-w-0">
                      {msg.profiles?.avatar_url?.trim() ? (
                        <img
                          src={msg.profiles.avatar_url}
                          alt={displayNameFromProfile(msg.profiles)}
                          className="w-10 h-10 rounded-full object-cover shrink-0 bg-indigo-100"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {avatarInitials(displayNameFromProfile(msg.profiles))}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{displayNameFromProfile(msg.profiles)}</p>
                        <p className="text-xs text-gray-500">Community Post • {formatRelativeTime(msg.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="px-4 pb-4 text-sm text-gray-700 wrap-break-word whitespace-pre-wrap">{msg.body}</p>
                  <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={() => void handleToggleLike(msg.id)}
                      disabled={likingMessageId === msg.id || !currentUserId}
                      className="inline-flex items-center gap-1.5 hover:text-gray-800 disabled:opacity-60"
                      aria-label="Toggle like"
                    >
                      {likes.some((l) => l.message_id === msg.id && l.user_id === currentUserId) ? (
                        <svg className="h-4 w-4 text-rose-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.53L12 21.35z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                          <path
                            d="M12.1 21.35l-1.1-1C5.14 15.24 2 12.39 2 8.86 2 6.09 4.12 4 6.91 4c1.57 0 3.08.73 4.09 1.88C12.01 4.73 13.52 4 15.09 4 17.88 4 20 6.09 20 8.86c0 3.53-3.14 6.38-8.99 11.49l-1.1 1z"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      <span>{likes.filter((l) => l.message_id === msg.id).length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyOpenByMessageId((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                      }
                      className="inline-flex items-center gap-1.5 hover:text-gray-800"
                      aria-label="Toggle replies"
                    >
                      <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <path
                          d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.31 0-2.55-.29-3.67-.8L3 21l1.96-4.9A8.46 8.46 0 0 1 4 11.5 8.5 8.5 0 1 1 21 11.5z"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{(repliesByMessageId[msg.id] ?? []).length}</span>
                    </button>
                  </div>
                  {replyOpenByMessageId[msg.id] && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                      {(repliesByMessageId[msg.id] ?? []).length > 0 && (
                        <div className="space-y-2 pt-3">
                          {(repliesByMessageId[msg.id] ?? []).map((reply) => (
                            <div key={reply.id} className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                              <p className="text-xs font-semibold text-gray-800">
                                {displayNameFromProfile(reply.profiles)}
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pt-2 flex items-end gap-2">
                        <textarea
                          rows={2}
                          value={replyDraftByMessageId[msg.id] ?? ""}
                          onChange={(e) =>
                            setReplyDraftByMessageId((prev) => ({ ...prev, [msg.id]: e.target.value }))
                          }
                          placeholder="Write a reply..."
                          className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => void handleReply(msg.id)}
                          disabled={replyingMessageId === msg.id || !(replyDraftByMessageId[msg.id] ?? "").trim()}
                          className="rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          style={{ backgroundColor: THEME.primary }}
                        >
                          {replyingMessageId === msg.id ? "Sending..." : "Reply"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4 order-2 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-w-0 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔔</span>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Recent Updates</h3>
              </div>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500">No activity on your posts yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentActivities.map((a) => (
                    <li key={a.id} className="min-w-0">
                      <Link
                        href={`/community?focus=${encodeURIComponent(a.messageId)}`}
                        className="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100"
                      >
                        <p className="text-sm font-medium text-gray-900 wrap-break-word">{a.text}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(a.createdAt)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">New Members</h3>
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active Now
                </span>
              </div>
              <ul className="space-y-3">
                {NEW_MEMBERS.map((m) => (
                  <li key={m.name} className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.role}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
                      aria-label={`Follow ${m.name}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 min-h-[44px] touch-manipulation"
              >
                See everyone
              </button>
            </div>

            <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 sm:p-5 min-w-0 md:col-span-2 lg:col-span-1">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-4 wrap-break-word">
                Mentors matching your profile
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {MENTORS.map((m) => (
                  <div key={m.name} className="bg-white rounded-xl border border-gray-200 p-3 text-center min-w-0">
                    <div className="w-12 h-12 rounded-full bg-violet-200 mx-auto" />
                    <p className="text-sm font-semibold text-gray-900 mt-2 truncate">{m.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{m.role}</p>
                    <button
                      type="button"
                      className="mt-2 w-full rounded-lg py-2 text-xs font-semibold text-white min-h-[40px] touch-manipulation"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
