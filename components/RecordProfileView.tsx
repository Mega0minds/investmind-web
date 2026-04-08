"use client";

import { useEffect, useRef } from "react";

/**
 * Fire-and-forget: records one profile view for analytics (authenticated viewers only).
 * Mount on pages where someone views another member's profile (pass their user id).
 */
export function RecordProfileView({ profileUserId }: { profileUserId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!profileUserId?.trim() || sent.current) return;
    sent.current = true;
    void fetch("/api/profile-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileUserId: profileUserId.trim() }),
    });
  }, [profileUserId]);

  return null;
}
