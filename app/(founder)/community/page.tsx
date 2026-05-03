 "use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "../_components/DashboardShell";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { avatarInitials } from "@/lib/user-display";
import { rolesForAudienceFilter } from "@/lib/roles";

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

type SidebarMentor = {
  id: string;
  name: string;
  expertise: string;
  avatarUrl: string | null;
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

const COMMUNITY_POLL_PREFIX = "__POLL__:";

/** Stored in `community_messages.body` (max 1000 chars). */
function encodePollBody(question: string, options: string[]): string {
  const q = question.trim();
  const o = options.map((x) => x.trim()).filter((x) => x.length > 0).slice(0, 6);
  return `${COMMUNITY_POLL_PREFIX}${JSON.stringify({ q, o })}`;
}

function decodePollBody(body: string): { q: string; o: string[] } | null {
  if (!body.startsWith(COMMUNITY_POLL_PREFIX)) return null;
  try {
    const raw = body.slice(COMMUNITY_POLL_PREFIX.length);
    const data = JSON.parse(raw) as { q?: unknown; o?: unknown };
    if (typeof data?.q !== "string" || !Array.isArray(data.o)) return null;
    const q = data.q.trim();
    const o = data.o.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
    if (!q || o.length < 2) return null;
    return { q, o: o.slice(0, 6) };
  } catch {
    return null;
  }
}

type PollVoteAgg = { counts: number[]; myVote: number | null; total: number };

type PollVoteRow = { message_id: string; option_index: number; user_id: string };

function aggregatePollVotes(
  messageList: CommunityMessageRow[],
  rows: PollVoteRow[],
  viewerId: string | null
): Record<string, PollVoteAgg> {
  const pollIds = messageList.filter((m) => decodePollBody(m.body)).map((m) => m.id);
  const next: Record<string, PollVoteAgg> = {};
  for (const mid of pollIds) {
    const poll = decodePollBody(messageList.find((m) => m.id === mid)?.body ?? "");
    if (!poll) continue;
    const n = poll.o.length;
    const counts = new Array(n).fill(0) as number[];
    let myVote: number | null = null;
    for (const row of rows) {
      if (row.message_id !== mid) continue;
      const idx = row.option_index;
      if (typeof idx === "number" && idx >= 0 && idx < n) counts[idx] += 1;
      if (viewerId && row.user_id === viewerId) myVote = idx;
    }
    next[mid] = { counts, myVote, total: counts.reduce((a, b) => a + b, 0) };
  }
  return next;
}

export default function CommunityPage() {
  const supabase = useMemo(() => createClient(), []);
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
  const [focusMessageId, setFocusMessageId] = useState<string | null>(null);
  const [sidebarMentors, setSidebarMentors] = useState<SidebarMentor[]>([]);
  const [requestedMentorIds, setRequestedMentorIds] = useState<string[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<SidebarMentor | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [connectingMentorId, setConnectingMentorId] = useState<string | null>(null);
  const [pollComposerOpen, setPollComposerOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollVoteByMessageId, setPollVoteByMessageId] = useState<Record<string, PollVoteAgg>>({});
  const [pollVoteError, setPollVoteError] = useState<string | null>(null);
  const [votingPollKey, setVotingPollKey] = useState<string | null>(null);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

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

        const [{ data: mentorRows }, { data: requestRows }, { data: acceptedRows }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, first_name, last_name, full_name, mentor_expertise, avatar_url")
            .in("role", rolesForAudienceFilter("investor"))
            .eq("profile_visible", true)
            .neq("id", userId)
            .limit(20),
          supabase
            .from("mentorship_requests")
            .select("mentor_id")
            .eq("requester_id", userId)
            .in("status", ["pending", "accepted"]),
          supabase
            .from("mentorship_requests")
            .select("requester_id, mentor_id")
            .eq("status", "accepted")
            .or(`and(requester_id.eq.${userId}),and(mentor_id.eq.${userId})`),
        ]);

        if (active) {
          const mentors = (mentorRows ?? []) as Array<{
            id: string;
            first_name?: string | null;
            last_name?: string | null;
            full_name?: string | null;
            mentor_expertise?: string[] | null;
            avatar_url?: string | null;
          }>;
          setSidebarMentors(
            mentors.map((m) => {
              const firstName = m.first_name?.trim() ?? "";
              const lastName = m.last_name?.trim() ?? "";
              const name =
                [firstName, lastName].filter(Boolean).join(" ").trim() ||
                m.full_name?.trim() ||
                "Investor";
              const expertise =
                Array.isArray(m.mentor_expertise) && m.mentor_expertise.length > 0
                  ? m.mentor_expertise.slice(0, 2).join(" · ")
                  : "Investor";
              return {
                id: m.id,
                name,
                expertise,
                avatarUrl: m.avatar_url?.trim() || null,
              };
            }).filter((m) => {
              const accepted = ((acceptedRows ?? []) as Array<{ requester_id?: string | null; mentor_id?: string | null }>)
                .some((r) => {
                  const requesterId = r.requester_id ?? null;
                  const mentorId = r.mentor_id ?? null;
                  return (
                    (requesterId === userId && mentorId === m.id) ||
                    (mentorId === userId && requesterId === m.id)
                  );
                });
              return !accepted;
            }).slice(0, 4)
          );
          setRequestedMentorIds(
            ((requestRows ?? []) as Array<{ mentor_id?: string | null }>)
              .map((r) => r.mentor_id ?? null)
              .filter((id): id is string => Boolean(id))
          );
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_poll_votes" },
        async () => {
          const m = messagesRef.current;
          const uid = currentUserIdRef.current;
          const pollIds = m.filter((x) => decodePollBody(x.body)).map((x) => x.id);
          if (!pollIds.length) {
            setPollVoteByMessageId({});
            return;
          }
          const { data: voteRows, error: voteErr } = await supabase
            .from("community_poll_votes")
            .select("message_id, option_index, user_id")
            .in("message_id", pollIds);
          if (voteErr) return;
          setPollVoteByMessageId(aggregatePollVotes(m, (voteRows ?? []) as PollVoteRow[], uid));
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = messages;
      const pollIds = m.filter((x) => decodePollBody(x.body)).map((x) => x.id);
      if (!pollIds.length) {
        if (!cancelled) setPollVoteByMessageId({});
        return;
      }
      const { data, error } = await supabase
        .from("community_poll_votes")
        .select("message_id, option_index, user_id")
        .in("message_id", pollIds);
      if (cancelled) return;
      if (error) {
        setPollVoteByMessageId({});
        return;
      }
      setPollVoteByMessageId(aggregatePollVotes(m, (data ?? []) as PollVoteRow[], currentUserId));
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, currentUserId, supabase]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setFocusMessageId(q.get("focus"));
  }, []);

  useEffect(() => {
    if (!focusMessageId || loadingMessages) return;
    const el = document.getElementById(`msg-${focusMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusMessageId, loadingMessages, messages.length]);

  async function handlePostMessage() {
    if (!currentUserId || posting) return;
    setPostError(null);
    setPosting(true);
    try {
      if (pollComposerOpen) {
        const q = pollQuestion.trim();
        const opts = pollOptions.map((o) => o.trim()).filter((o) => o.length > 0);
        if (!q || opts.length < 2) {
          setPostError("Add a poll question and at least two options.");
          return;
        }
        const body = encodePollBody(q, opts);
        if (body.length > 1000) {
          setPostError("Poll is too long. Shorten the question or options (max 1000 characters).");
          return;
        }
        const { error } = await supabase.from("community_messages").insert({ body, user_id: currentUserId });
        if (error) {
          setPostError(error.message || "Could not post poll.");
        } else {
          setPollComposerOpen(false);
          setPollQuestion("");
          setPollOptions(["", ""]);
        }
        return;
      }
      const body = composerText.trim();
      if (!body) return;
      const { error } = await supabase.from("community_messages").insert({ body, user_id: currentUserId });
      if (error) {
        setPostError(error.message || "Could not post message.");
      } else {
        setComposerText("");
      }
    } finally {
      setPosting(false);
    }
  }

  async function handlePollVote(messageId: string, optionIndex: number) {
    if (!currentUserId || votingPollKey) return;
    setPollVoteError(null);
    setVotingPollKey(`${messageId}-${optionIndex}`);
    const { error } = await supabase.from("community_poll_votes").upsert(
      { message_id: messageId, user_id: currentUserId, option_index: optionIndex },
      { onConflict: "message_id,user_id" }
    );
    setVotingPollKey(null);
    if (error) {
      setPollVoteError(error.message);
      return;
    }
    const m = messagesRef.current;
    const pollIds = m.filter((x) => decodePollBody(x.body)).map((x) => x.id);
    if (!pollIds.length) return;
    const { data } = await supabase
      .from("community_poll_votes")
      .select("message_id, option_index, user_id")
      .in("message_id", pollIds);
    setPollVoteByMessageId(aggregatePollVotes(m, (data ?? []) as PollVoteRow[], currentUserId));
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

  async function handleConnectMentor(mentor: SidebarMentor) {
    setSelectedMentor(mentor);
    setRequestMessage(`Hi ${mentor.name}, I would love to learn from your experience.`);
    setRequestError(null);
  }

  async function submitConnectRequest() {
    if (!selectedMentor || connectingMentorId) return;
    const trimmed = requestMessage.trim();
    if (trimmed.length < 5 || trimmed.length > 300) {
      setRequestError("Message must be between 5 and 300 characters.");
      return;
    }

    const mentor = selectedMentor;
    if (connectingMentorId || requestedMentorIds.includes(mentor.id)) return;
    setConnectingMentorId(mentor.id);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: mentor.id, message: trimmed }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setRequestError(payload?.error || "Could not send request.");
        return;
      }
      if (res.ok) {
        setRequestedMentorIds((prev) => (prev.includes(mentor.id) ? prev : [...prev, mentor.id]));
        setSelectedMentor(null);
        setRequestMessage("");
        setRequestError(null);
      }
    } finally {
      setConnectingMentorId(null);
    }
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
                  {pollComposerOpen ? (
                    <div className="space-y-3">
                      <label htmlFor="poll-question" className="sr-only">
                        Poll question
                      </label>
                      <textarea
                        id="poll-question"
                        rows={2}
                        placeholder="What do you want to ask?"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none min-h-[72px]"
                      />
                      <p className="text-xs text-gray-500">Add 2–4 choices. Members can vote once and change their vote anytime.</p>
                      <div className="space-y-2">
                        {pollOptions.map((opt, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              setPollOptions((prev) => {
                                const next = [...prev];
                                next[idx] = e.target.value;
                                return next;
                              })
                            }
                            placeholder={`Option ${idx + 1}`}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pollOptions.length < 4 ? (
                          <button
                            type="button"
                            onClick={() => setPollOptions((prev) => [...prev, ""])}
                            className="text-xs sm:text-sm font-medium text-[#5A2D8F] hover:underline touch-manipulation"
                          >
                            + Add option
                          </button>
                        ) : null}
                        {pollOptions.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => setPollOptions((prev) => prev.slice(0, -1))}
                            className="text-xs sm:text-sm font-medium text-gray-600 hover:underline touch-manipulation"
                          >
                            Remove last option
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setPostError(null);
                          setPollVoteError(null);
                          setPollComposerOpen((open) => !open);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-medium touch-manipulation transition ${
                          pollComposerOpen
                            ? "border-[#5A2D8F] bg-violet-50 text-[#5A2D8F]"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-base" aria-hidden>
                          📊
                        </span>
                        Poll
                      </button>
                      {pollComposerOpen ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPollComposerOpen(false);
                            setPollQuestion("");
                            setPollOptions(["", ""]);
                            setPostError(null);
                          }}
                          className="text-xs sm:text-sm font-medium text-gray-600 hover:underline touch-manipulation"
                        >
                          Back to post
                        </button>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handlePostMessage()}
                      disabled={
                        posting ||
                        !currentUserId ||
                        (pollComposerOpen
                          ? !pollQuestion.trim() ||
                            pollOptions.map((o) => o.trim()).filter(Boolean).length < 2
                          : !composerText.trim())
                      }
                      className="rounded-xl px-5 py-2.5 sm:py-2 text-sm font-semibold text-white min-h-[44px] w-full sm:w-auto touch-manipulation disabled:opacity-60"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      {posting ? "Posting..." : pollComposerOpen ? "Post poll" : "Post"}
                    </button>
                  </div>
                  {postError && <p className="mt-2 text-xs text-red-600">{postError}</p>}
                  {pollVoteError && <p className="mt-2 text-xs text-red-600">{pollVoteError}</p>}
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
                  {(() => {
                    const poll = decodePollBody(msg.body);
                    if (!poll) {
                      return (
                        <p className="px-4 pb-4 text-sm text-gray-700 wrap-break-word whitespace-pre-wrap">{msg.body}</p>
                      );
                    }
                    const agg = pollVoteByMessageId[msg.id];
                    const counts = poll.o.map((_, i) => agg?.counts[i] ?? 0);
                    const total = counts.reduce((a, b) => a + b, 0);
                    const myVote = agg?.myVote ?? null;
                    return (
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-sm font-semibold text-gray-900">{poll.q}</p>
                        <ul className="space-y-2">
                          {poll.o.map((label, idx) => {
                            const count = counts[idx] ?? 0;
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            const selected = myVote === idx;
                            return (
                              <li key={idx}>
                                <button
                                  type="button"
                                  disabled={!currentUserId || votingPollKey !== null}
                                  onClick={() => void handlePollVote(msg.id, idx)}
                                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition touch-manipulation disabled:opacity-60 ${
                                    selected
                                      ? "border-[#5A2D8F] bg-violet-50"
                                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-gray-900 wrap-break-word">{label}</span>
                                    <span className="shrink-0 text-xs text-gray-600 tabular-nums">
                                      {pct}% · {count}
                                    </span>
                                  </div>
                                  <div className="mt-2 h-2 rounded-full bg-white/80 border border-gray-100 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${pct}%`, backgroundColor: THEME.primary }}
                                    />
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        {!currentUserId ? (
                          <p className="text-xs text-gray-500">Sign in to vote on polls.</p>
                        ) : null}
                      </div>
                    );
                  })()}
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

            <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 sm:p-5 min-w-0 md:col-span-2 lg:col-span-1">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-4 wrap-break-word">
                Investors matching your profile
              </h3>
              {sidebarMentors.length === 0 ? (
                <p className="text-sm text-gray-500">No investors available right now.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {sidebarMentors.map((m) => (
                    <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-3 text-center min-w-0">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.name}
                          className="w-12 h-12 rounded-full object-cover mx-auto bg-violet-100"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-violet-200 text-violet-700 mx-auto flex items-center justify-center text-sm font-semibold">
                          {avatarInitials(m.name)}
                        </div>
                      )}
                      <p className="text-sm font-semibold text-gray-900 mt-2 truncate">{m.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{m.expertise}</p>
                      <button
                        type="button"
                        onClick={() => void handleConnectMentor(m)}
                        disabled={requestedMentorIds.includes(m.id) || connectingMentorId === m.id}
                        className="mt-2 w-full rounded-lg py-2 text-xs font-semibold text-white min-h-[40px] touch-manipulation disabled:opacity-60"
                        style={{ backgroundColor: requestedMentorIds.includes(m.id) ? "#64748B" : THEME.primary }}
                      >
                        {requestedMentorIds.includes(m.id)
                          ? "Requested"
                          : connectingMentorId === m.id
                          ? "Connecting..."
                          : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Connection</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Send a short note to {selectedMentor.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!connectingMentorId) {
                    setSelectedMentor(null);
                    setRequestError(null);
                  }
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="connect-message">
              Message
            </label>
            <textarea
              id="connect-message"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value.slice(0, 300))}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="Write a short message..."
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>
                {requestError ? <span className="text-red-600">{requestError}</span> : "Keep it short and clear."}
              </span>
              <span>{requestMessage.trim().length}/300</span>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!connectingMentorId) {
                    setSelectedMentor(null);
                    setRequestError(null);
                  }
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitConnectRequest()}
                disabled={connectingMentorId === selectedMentor.id}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: THEME.primary }}
              >
                {connectingMentorId === selectedMentor.id ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
