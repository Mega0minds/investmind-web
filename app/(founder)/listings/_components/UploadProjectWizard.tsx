"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeGetSession } from "@/lib/supabase/safe-auth";
import { THEME } from "@/lib/constants";
import { FOUNDER_INTEREST_SECTOR_OPTIONS } from "@/lib/mentor-matching";
import { projectMediaPublicUrl } from "@/lib/project-media-url";

type WizardStep = 1 | 2 | 3 | 4 | 5;

type UploadDraft = {
  step: WizardStep;
  // Step 1
  projectName: string;
  tagline: string;
  shortDescription: string;
  // Step 2
  sector: string;
  stage: string;
  // Step 3
  coverImageFileName: string;
  screenshotFileNames: string[];
  productVideoUrl: string;
  // Step 4
  discoveryTags: string[];
  market: string;
  // Step 5
  pitchSummary: string;
  teamSize: string;
};

type ComparableDraft = Omit<UploadDraft, "step">;

const DRAFT_STORAGE_PREFIX = "uploadWizardDraft";

const STEPS: Array<{ title: string; id: WizardStep }> = [
  { id: 1, title: "Basic Information" },
  { id: 2, title: "Sector & Stage" },
  { id: 3, title: "Media" },
  { id: 4, title: "Tags & Market" },
  { id: 5, title: "Pitch & Team" },
];

function clampStep(n: unknown): WizardStep {
  const v = typeof n === "string" ? Number(n) : typeof n === "number" ? n : NaN;
  if (v >= 1 && v <= 5) return v as WizardStep;
  return 1;
}

function getDefaultDraft(step: WizardStep = 1): UploadDraft {
  return {
    step,
    projectName: "",
    tagline: "",
    shortDescription: "",
    sector: "",
    stage: "",
    coverImageFileName: "",
    screenshotFileNames: [],
    productVideoUrl: "",
    discoveryTags: [],
    market: "",
    pitchSummary: "",
    teamSize: "",
  };
}

function getComparableDraft(draft: UploadDraft): ComparableDraft {
  return {
    projectName: draft.projectName,
    tagline: draft.tagline,
    shortDescription: draft.shortDescription,
    sector: draft.sector,
    stage: draft.stage,
    coverImageFileName: draft.coverImageFileName,
    screenshotFileNames: draft.screenshotFileNames,
    productVideoUrl: draft.productVideoUrl,
    discoveryTags: draft.discoveryTags,
    market: draft.market,
    pitchSummary: draft.pitchSummary,
    teamSize: draft.teamSize,
  };
}

function Stepper({
  step,
  editable,
  onStepClick,
  stepComplete,
}: {
  step: WizardStep;
  editable: boolean;
  onStepClick: (next: WizardStep) => void;
  stepComplete: Record<WizardStep, boolean>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mt-4 mb-6">
      {STEPS.map((s, idx) => {
        const complete = stepComplete[s.id];
        const active = s.id === step;
        return (
          <div key={s.id} className="flex-1 flex flex-col items-center">
            <button
              type="button"
              onClick={() => editable && onStepClick(s.id)}
              disabled={!editable}
              className={[
                "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold border",
                editable ? "cursor-pointer" : "cursor-default",
                active
                  ? "bg-[#5A2D8F] border-[#5A2D8F] text-white"
                  : complete
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-gray-50 border-gray-200 text-gray-400",
              ].join(" ")}
              aria-current={active ? "step" : undefined}
              aria-label={`${s.title}${complete ? ", complete" : active ? ", current step" : ", incomplete"}`}
            >
              {idx + 1}
            </button>
            <div className="mt-2 text-[11px] sm:text-xs text-gray-500 text-center leading-tight">
              {s.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function UploadProjectWizard() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);

  const [draft, setDraft] = useState<UploadDraft>(() => getDefaultDraft(1));
  /** True when opened via `?listingId=` (editing an existing row). Used after Publish to decide reset vs stay. */
  const [openedFromEditUrl, setOpenedFromEditUrl] = useState(false);
  /** Server `projects.status` after load or save; `null` before any server row exists. */
  const [listingStatus, setListingStatus] = useState<"draft" | "published" | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [showSubmitSuccessModal, setShowSubmitSuccessModal] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [screenshotsUploading, setScreenshotsUploading] = useState(false);
  const mediaUploading = coverUploading || screenshotsUploading;
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [screenshotPreviewUrls, setScreenshotPreviewUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"draft" | "save" | "publish" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastPersistedComparableDraft, setLastPersistedComparableDraft] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  // Load user + role + existing draft (if any).
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const session = await safeGetSession<{ user?: { id: string } }>(supabase);
      if (cancelled) return;
      if (!session?.user) return;

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      setRole(profile?.role ?? null);

      const params = new URLSearchParams(window.location.search);
      const listingIdParam = params.get("listingId")?.trim();
      const stepParam = params.get("step");

      // If an explicit listingId is provided (from Edit button), load that exact project.
      try {
        if (listingIdParam) {
          setOpenedFromEditUrl(true);
          const res = await fetch(`/api/listings/${listingIdParam}`);
          if (!res.ok) return;
          const payload = (await res.json()) as {
            listing?: {
              id: string;
              status?: string | null;
              step?: number | null;
              project_name?: string | null;
              tagline?: string | null;
              short_description?: string | null;
              sector?: string | null;
              subcategory?: string | null;
              stage?: string | null;
              cover_image_file_name?: string | null;
              screenshot_file_names?: string[] | null;
              product_video_url?: string | null;
              discovery_tags?: string[] | null;
              market?: string | null;
              pitch_summary?: string | null;
              team_size?: string | null;
            } | null;
          };
          if (!payload.listing) return;
          const d = payload.listing;
          const st = d.status === "published" || d.status === "draft" ? d.status : null;
          setListingStatus(st);
          const requestedStep = stepParam ? clampStep(stepParam) : clampStep(d.step ?? 1);
          setListingId(d.id);
          const loadedDraft: UploadDraft = {
            step: requestedStep,
            projectName: d.project_name ?? "",
            tagline: d.tagline ?? "",
            shortDescription: d.short_description ?? "",
            sector: d.sector ?? "",
            stage: d.stage ?? "",
            coverImageFileName: d.cover_image_file_name ?? "",
            screenshotFileNames: Array.isArray(d.screenshot_file_names) ? d.screenshot_file_names : [],
            productVideoUrl: d.product_video_url ?? "",
            discoveryTags: Array.isArray(d.discovery_tags) ? d.discovery_tags : [],
            market: d.market ?? "",
            pitchSummary: d.pitch_summary ?? "",
            teamSize: d.team_size ?? "",
          };
          setDraft(loadedDraft);
          setLastPersistedComparableDraft(JSON.stringify(getComparableDraft(loadedDraft)));
          return;
        }

        const storageKey = `${DRAFT_STORAGE_PREFIX}:${session.user.id}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsedRaw = JSON.parse(stored) as Partial<UploadDraft> & {
              step?: WizardStep;
              subcategory?: string;
            };
            const { subcategory: _legacySub, ...parsed } = parsedRaw;
            void _legacySub;
            const parsedLegacy = parsed as Partial<UploadDraft> & {
              step?: WizardStep;
              pitchDeckFileName?: string;
              tags?: string;
            };
            const s = parsed.step ? clampStep(parsed.step) : 1;
            const normalizedStage =
              parsed.stage === "Drawing" ? "Growing" : (parsed.stage ?? "");
            const normalizedCoverImage =
              parsed.coverImageFileName ?? parsedLegacy.pitchDeckFileName ?? "";
            setDraft({
              ...getDefaultDraft(s),
              ...parsed,
              stage: normalizedStage,
              coverImageFileName: normalizedCoverImage,
              screenshotFileNames: Array.isArray(parsed.screenshotFileNames)
                ? parsed.screenshotFileNames.filter((x): x is string => typeof x === "string")
                : [],
              discoveryTags: Array.isArray(parsed.discoveryTags)
                ? parsed.discoveryTags.filter((x): x is string => typeof x === "string")
                : typeof parsedLegacy.tags === "string" && parsedLegacy.tags.trim()
                ? parsedLegacy.tags
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                : [],
              productVideoUrl:
                typeof parsed.productVideoUrl === "string" ? parsed.productVideoUrl : "",
              step: s,
            });
          } catch {
            // ignore corrupted draft
          }
        }

        // Prefer backend draft when available when not editing a specific listing.
        const res = await fetch("/api/listings?draft=1");
        if (!res.ok) return;
        const payload = (await res.json()) as {
          draft?: {
            id: string;
            status?: string | null;
            step?: number | null;
            project_name?: string | null;
            tagline?: string | null;
            short_description?: string | null;
            sector?: string | null;
            subcategory?: string | null;
            stage?: string | null;
            cover_image_file_name?: string | null;
            screenshot_file_names?: string[] | null;
            product_video_url?: string | null;
            discovery_tags?: string[] | null;
            market?: string | null;
            pitch_summary?: string | null;
            team_size?: string | null;
          } | null;
        };
        if (!payload.draft) return;
        const d = payload.draft;
        const st = d.status === "published" || d.status === "draft" ? d.status : "draft";
        setListingStatus(st);
        const requestedStep = stepParam ? clampStep(stepParam) : clampStep(d.step ?? 1);
        setListingId(d.id);
        const loadedDraft: UploadDraft = {
          step: requestedStep,
          projectName: d.project_name ?? "",
          tagline: d.tagline ?? "",
          shortDescription: d.short_description ?? "",
          sector: d.sector ?? "",
          stage: d.stage ?? "",
          coverImageFileName: d.cover_image_file_name ?? "",
          screenshotFileNames: Array.isArray(d.screenshot_file_names) ? d.screenshot_file_names : [],
          productVideoUrl: d.product_video_url ?? "",
          discoveryTags: Array.isArray(d.discovery_tags) ? d.discovery_tags : [],
          market: d.market ?? "",
          pitchSummary: d.pitch_summary ?? "",
          teamSize: d.team_size ?? "",
        };
        setDraft(loadedDraft);
        setLastPersistedComparableDraft(JSON.stringify(getComparableDraft(loadedDraft)));
      } catch {
        // fallback to local draft only
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // If URL requested a step, keep it in sync.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get("step");
    if (!stepParam) return;
    const s = clampStep(stepParam);
    setDraft((d) => ({ ...d, step: s }));
  }, []);

  const saveToBackend = useCallback(
    async (status: "draft" | "published"): Promise<{ ok: true } | { ok: false; error: string }> => {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: listingId ?? undefined,
          status,
          step: draft.step,
          projectName: draft.projectName,
          tagline: draft.tagline,
          shortDescription: draft.shortDescription,
          sector: draft.sector,
          subcategory: "",
          stage: draft.stage,
          coverImageFileName: draft.coverImageFileName,
          screenshotFileNames: draft.screenshotFileNames,
          productVideoUrl: draft.productVideoUrl,
          discoveryTags: draft.discoveryTags,
          market: draft.market,
          pitchSummary: draft.pitchSummary,
          teamSize: draft.teamSize,
        }),
      });
      if (!res.ok) {
        let message = "Could not save. Please try again.";
        try {
          const err = (await res.json()) as { error?: string };
          if (typeof err.error === "string" && err.error.trim()) message = err.error.trim();
        } catch {
          /* ignore */
        }
        return { ok: false, error: message };
      }
      const payload = (await res.json()) as {
        listing?: { id?: string; status?: string | null };
      };
      const listing = payload.listing;
      if (listing?.id) setListingId(listing.id);
      if (listing?.status === "published" || listing?.status === "draft") {
        setListingStatus(listing.status);
      }
      return { ok: true };
    },
    [listingId, draft]
  );

  // Browser-only recovery (never writes to the database until you click Add to draft / Save / Publish).
  useEffect(() => {
    if (!userId) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const storageKey = `${DRAFT_STORAGE_PREFIX}:${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }, 400);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [draft, userId]);

  function listingsNewHref(nextStep: WizardStep) {
    const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    q.set("step", String(nextStep));
    return `/listings/new?${q.toString()}`;
  }

  async function handleAddToDraft() {
    if (!userId) return;
    setSaveError(null);
    setLoadingAction("draft");
    setLoading(true);
    try {
      const storageKey = `${DRAFT_STORAGE_PREFIX}:${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(draft));
      const result = await saveToBackend("draft");
      if (result.ok) {
        router.push("/listings");
        void router.refresh();
      } else setSaveError(result.error);
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }

  async function handleSavePublished() {
    if (!userId) return;
    setSaveError(null);
    setLoadingAction("save");
    setLoading(true);
    try {
      const storageKey = `${DRAFT_STORAGE_PREFIX}:${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(draft));
      const result = await saveToBackend("published");
      if (result.ok) {
        setLastPersistedComparableDraft(JSON.stringify(getComparableDraft(draft)));
        router.push("/listings");
        void router.refresh();
      } else setSaveError(result.error);
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }

  function handleAddDiscoveryTag() {
    const val = tagInput.trim();
    if (!val) return;
    setDraft((d) => {
      if (d.discoveryTags.some((t) => t.toLowerCase() === val.toLowerCase())) return d;
      return { ...d, discoveryTags: [...d.discoveryTags, val].slice(0, 10) };
    });
    setTagInput("");
  }

  async function uploadProjectMediaFile(file: File, kind: "cover" | "screenshots"): Promise<string | null> {
    if (!userId) {
      console.error("[UploadProjectWizard] upload blocked: missing userId", {
        kind,
        name: file.name,
        type: file.type,
        size: file.size,
      });
      setMediaError("Your account is still loading. Please wait a second and try again.");
      return null;
    }
    if (process.env.NODE_ENV !== "production") {
      console.log("[UploadProjectWizard] uploading file", {
        kind,
        name: file.name,
        type: file.type,
        size: file.size,
        userId,
      });
    }
    const UPLOAD_TIMEOUT_MS = 120_000;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const res = await fetch("/api/storage/project-media/upload", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      const payload = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
      if (!res.ok || !payload.path) {
        const message = payload.error || "Image upload failed. Please try again.";
        setMediaError(message);
        console.error("[UploadProjectWizard] storage upload failed", {
          kind,
          name: file.name,
          type: file.type,
          size: file.size,
          message,
        });
        return null;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[UploadProjectWizard] storage upload success", {
          kind,
          path: payload.path,
          name: file.name,
        });
      }
      return payload.path;
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      setMediaError(
        aborted ? "Upload timed out. Check your connection and try again." : "Image upload failed. Please try again."
      );
      console.error("[UploadProjectWizard] storage upload exception", {
        kind,
        name: file.name,
        type: file.type,
        size: file.size,
        error,
      });
      return null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  const sectorOptions = useMemo(
    () => FOUNDER_INTEREST_SECTOR_OPTIONS.map((s) => ({ value: s, label: s })),
    []
  );

  const stageOptions = useMemo(
    () => [
      { value: "Idea Stage", label: "Idea Stage" },
      { value: "Prototype", label: "Prototype" },
      { value: "Early Users", label: "Early Users" },
      { value: "Growing", label: "Growing" },
    ],
    []
  );

  const coverImageDisplaySrc = useMemo(() => {
    if (coverPreviewUrl) return coverPreviewUrl;
    const key = draft.coverImageFileName.trim();
    if (!key) return null;
    return projectMediaPublicUrl(key);
  }, [coverPreviewUrl, draft.coverImageFileName]);

  const isStep1Valid = Boolean(
    draft.projectName.trim() && draft.tagline.trim() && draft.shortDescription.trim()
  );
  const isStep2Valid = Boolean(draft.sector && draft.stage);
  const isStep3Valid = Boolean(draft.coverImageFileName.trim());
  const isStep4Valid = Boolean(draft.discoveryTags.length > 0 && draft.market.trim());
  const isStep5Valid = Boolean(draft.pitchSummary.trim() && draft.teamSize.trim());

  const isCurrentStepValid =
    (draft.step === 1 && isStep1Valid) ||
    (draft.step === 2 && isStep2Valid) ||
    (draft.step === 3 && isStep3Valid) ||
    (draft.step === 4 && isStep4Valid) ||
    (draft.step === 5 && isStep5Valid);

  const isFullyValid =
    isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid && isStep5Valid;

  async function handlePublish() {
    if (!isFullyValid) return;
    if (!userId) return;
    setSaveError(null);
    setLoadingAction("publish");
    setLoading(true);
    try {
      const storageKey = `${DRAFT_STORAGE_PREFIX}:${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(draft));
      const result = await saveToBackend("published");
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      localStorage.removeItem(storageKey);
      if (openedFromEditUrl) {
        void router.refresh();
      } else {
        setDraft(getDefaultDraft(1));
        setListingId(null);
        setListingStatus(null);
        router.replace("/listings/new?step=1");
      }
      setShowSubmitSuccessModal(true);
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }

  const handleNext = () => {
    if (!isCurrentStepValid) return;
    const next = Math.min(5, draft.step + 1) as WizardStep;
    setDraft((d) => ({ ...d, step: next }));
    router.replace(listingsNewHref(next));
  };

  const handleBack = () => {
    const prev = Math.max(1, draft.step - 1) as WizardStep;
    setDraft((d) => ({ ...d, step: prev }));
    router.replace(listingsNewHref(prev));
  };

  const currentStepValidationMessage =
    draft.step === 1
      ? "Project name, tagline, and short description are required."
      : draft.step === 2
      ? "Sector and stage are required."
      : draft.step === 3
      ? "Cover image is required."
      : draft.step === 4
      ? "Add at least one discovery tag and complete target market analysis."
      : "Pitch summary and team size are required.";
  const isEditMode = Boolean(listingId);
  const isPublished = listingStatus === "published";
  const hasPublishedChanges =
    lastPersistedComparableDraft !== null &&
    JSON.stringify(getComparableDraft(draft)) !== lastPersistedComparableDraft;
  const goToStep = (next: WizardStep) => {
    setDraft((d) => ({ ...d, step: next }));
    router.replace(listingsNewHref(next));
  };
  const goBackToProjects = () => {
    router.push("/listings");
  };

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
      screenshotPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [coverPreviewUrl, screenshotPreviewUrls]);

  if (role && role !== "founder") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Upload Your Project</h2>
        <p className="mt-2 text-sm text-gray-600">
          Project uploads are available for creatives only. Please switch to a creative profile
          to continue.
        </p>
      </div>
    );
  }

  const current = STEPS.find((s) => s.id === draft.step) ?? STEPS[0];

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditMode ? "Edit Your Project" : "Upload Your Project"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Share your idea with mentors and other creatives. Add details so they can understand your vision.
          </p>
        </div>
      </div>

      <Stepper
        step={draft.step}
        editable={isEditMode}
        onStepClick={goToStep}
        stepComplete={{
          1: isStep1Valid,
          2: isStep2Valid,
          3: isStep3Valid,
          4: isStep4Valid,
          5: isStep5Valid,
        }}
      />

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">{current.title}</h2>
        </div>

        {draft.step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Project Name</label>
              <input
                value={draft.projectName}
                onChange={(e) => setDraft((d) => ({ ...d, projectName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30"
                placeholder="e.g. EcoFlow Energy"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline</label>
              <input
                value={draft.tagline}
                onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30"
                placeholder="A one-sentence hook for your project"
              />
              <div className="text-[11px] text-gray-500 mt-1">KEEP IT PUNCHY AND MEMORABLE</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
              <textarea
                rows={3}
                value={draft.shortDescription}
                onChange={(e) => setDraft((d) => ({ ...d, shortDescription: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30 resize-y"
                placeholder="Explain what you do in 2–3 sentences."
              />
            </div>
          </div>
        )}

        {draft.step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Define your position</h2>
              <p className="text-sm text-gray-600 mt-1">
                Help investors find you by categorizing your venture&apos;s industry and current development
                maturity.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-gray-900">Industry &amp; Sector</div>
                <div className="text-xs text-gray-600 mt-1">
                  Choose the sector that best describes your venture.
                </div>
              </div>

              <div className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-2">
                Sector
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sectorOptions.map((s) => {
                  const active = draft.sector === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, sector: s.value }))}
                      className={`rounded-xl border px-3 py-2 text-sm text-left touch-manipulation min-h-[44px] text-gray-900 ${
                        active
                          ? "border-[#5A2D8F] bg-[#EEF2FF] text-[#5A2D8F]"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Current Stage</div>
                  <div className="text-xs text-gray-600 mt-1">Where are you in your product journey?</div>
                </div>
                <div className="text-[11px] text-gray-500">Step {draft.step}/5</div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {stageOptions.map((st) => {
                  const active = draft.stage === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, stage: st.value }))}
                      className={`rounded-xl border px-2 py-3 touch-manipulation min-h-[60px] flex flex-col items-center justify-center gap-1 ${
                        active
                          ? "border-[#5A2D8F] bg-[#EEF2FF] text-[#5A2D8F]"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="text-xs font-semibold">{st.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!isStep2Valid && (
              <p className="text-xs text-gray-500">
                Select sector and stage to continue.
              </p>
            )}
          </div>
        )}

        {draft.step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Bring your project to life</h2>
              <p className="text-sm text-gray-600 mt-2 text-center">
                High-quality visuals significantly increase investor engagement. Showcase your
                product&apos;s identity and user experience.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Cover Image</label>
                <span className="text-[11px] text-gray-500">Required • 16:9 ratio</span>
              </div>
              <label className="relative block rounded-2xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition p-8 text-center cursor-pointer overflow-hidden">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={!userId || mediaUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void (async () => {
                      setMediaError(null);
                      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
                      const nextPreviewUrl = URL.createObjectURL(file);
                      setCoverPreviewUrl(nextPreviewUrl);
                      setCoverUploading(true);
                      try {
                        const path = await uploadProjectMediaFile(file, "cover");
                        if (path) {
                          const oldCoverKey = draft.coverImageFileName;
                          if (oldCoverKey) {
                            const supabase = createClient();
                            void supabase.storage
                              .from("project-media")
                              .remove([oldCoverKey])
                              .then(({ error }) => {
                                if (error) {
                                  console.warn("[UploadProjectWizard] remove old cover failed (non-blocking)", error);
                                }
                              });
                          }
                          setDraft((d) => ({ ...d, coverImageFileName: path }));
                        } else {
                          console.error("[UploadProjectWizard] cover upload returned null path");
                          URL.revokeObjectURL(nextPreviewUrl);
                          setCoverPreviewUrl(null);
                          // `uploadProjectMediaFile` already set `mediaError` from the API when possible
                        }
                      } finally {
                        setCoverUploading(false);
                      }
                    })();
                  }}
                />
                {coverImageDisplaySrc ? (
                  <Image
                    src={coverImageDisplaySrc}
                    alt="Cover preview"
                    width={640}
                    height={360}
                    unoptimized
                    className="mx-auto mb-3 max-h-40 w-auto rounded-xl border border-gray-200 object-contain"
                  />
                ) : (
                  <div
                    className="mx-auto w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: "#EFE7FC", color: "#5A2D8F" }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <p className="mt-3 text-sm font-semibold text-gray-800">Upload Cover Image</p>
                <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse. Supports JPG, PNG (max 5MB).</p>
                {mediaError && <p className="text-xs text-red-600 mt-2">{mediaError}</p>}
                {coverUploading ? (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/80 backdrop-blur-[2px]"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <span className="h-10 w-10 rounded-full border-2 border-[#5A2D8F] border-t-transparent animate-spin" />
                    <span className="text-sm font-semibold text-gray-800">Uploading image…</span>
                  </div>
                ) : null}
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Screenshots</label>
                <span className="text-[11px] text-gray-500">Optional • Up to 5 images</span>
              </div>
              <label className="inline-flex mb-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  disabled={!userId || mediaUploading}
                  onChange={(e) => {
                    const input = e.currentTarget;
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    void (async () => {
                      setMediaError(null);
                      const remainingSlots = Math.max(0, 5 - draft.screenshotFileNames.length);
                      const toAdd = files.slice(0, remainingSlots);
                      if (!toAdd.length) return;
                      setScreenshotsUploading(true);
                      try {
                        const uploaded = await Promise.all(
                          toAdd.map((file) => uploadProjectMediaFile(file, "screenshots"))
                        );
                        const validPaths = uploaded.filter((p): p is string => Boolean(p));
                        if (!validPaths.length) {
                          console.error("[UploadProjectWizard] screenshot upload failed for all selected files", {
                            selectedCount: toAdd.length,
                          });
                        }
                        if (validPaths.length) {
                          setDraft((d) => ({
                            ...d,
                            screenshotFileNames: [...d.screenshotFileNames, ...validPaths],
                          }));
                          setScreenshotPreviewUrls((prev) => [
                            ...prev,
                            ...toAdd.slice(0, validPaths.length).map((f) => URL.createObjectURL(f)),
                          ]);
                        }
                        if (validPaths.length !== toAdd.length) {
                          setMediaError("Some screenshots failed to upload. Please retry.");
                        }
                      } finally {
                        setScreenshotsUploading(false);
                        input.value = "";
                      }
                    })();
                  }}
                />
                Add Screens
              </label>
              <div className="relative grid grid-cols-3 gap-3">
                {screenshotsUploading ? (
                  <div
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/80 backdrop-blur-[2px]"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <span className="h-9 w-9 rounded-full border-2 border-[#5A2D8F] border-t-transparent animate-spin" />
                    <span className="text-xs font-semibold text-gray-800">Uploading images…</span>
                  </div>
                ) : null}
                {draft.screenshotFileNames.map((path, i) => {
                  const preview = screenshotPreviewUrls[i];
                  const imgSrc = preview ?? projectMediaPublicUrl(path);
                  return (
                    <div
                      key={`${path}-${i}`}
                      className="relative aspect-4/3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-[11px] text-gray-500 overflow-hidden"
                    >
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={`Screenshot ${i + 1}`}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 33vw, 200px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-[#5A2D8F]"
                          style={{ backgroundColor: "#EFE7FC" }}
                          role="img"
                          aria-label={`Screenshot ${i + 1}, preview unavailable`}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const pathToDelete = draft.screenshotFileNames[i];
                          if (pathToDelete) {
                            const supabase = createClient();
                            void supabase.storage.from("project-media").remove([pathToDelete]);
                          }
                          setDraft((d) => ({
                            ...d,
                            screenshotFileNames: d.screenshotFileNames.filter((_, idx) => idx !== i),
                          }));
                          setScreenshotPreviewUrls((prev) => {
                            const next = [...prev];
                            const removed = next[i];
                            if (removed) URL.revokeObjectURL(removed);
                            next.splice(i, 1);
                            return next;
                          });
                        }}
                        className="absolute top-1 right-1 rounded-full bg-black/60 text-white w-5 h-5 text-[10px] leading-5"
                        aria-label={`Remove screenshot ${i + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {draft.screenshotFileNames.length < 5 && (
                  <label className="aspect-4/3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-500 cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      disabled={!userId || mediaUploading}
                      onChange={(e) => {
                        const input = e.currentTarget;
                        const files = Array.from(e.target.files ?? []);
                        if (!files.length) return;
                        void (async () => {
                          setMediaError(null);
                          const remainingSlots = Math.max(0, 5 - draft.screenshotFileNames.length);
                          const toAdd = files.slice(0, remainingSlots);
                          if (!toAdd.length) return;
                          setScreenshotsUploading(true);
                          try {
                            const uploaded = await Promise.all(
                              toAdd.map((file) => uploadProjectMediaFile(file, "screenshots"))
                            );
                            const validPaths = uploaded.filter((p): p is string => Boolean(p));
                            if (!validPaths.length) {
                              console.error("[UploadProjectWizard] screenshot tile upload failed for all selected files", {
                                selectedCount: toAdd.length,
                              });
                            }
                            if (validPaths.length) {
                              setDraft((d) => ({
                                ...d,
                                screenshotFileNames: [...d.screenshotFileNames, ...validPaths],
                              }));
                              setScreenshotPreviewUrls((prev) => [
                                ...prev,
                                ...toAdd.slice(0, validPaths.length).map((f) => URL.createObjectURL(f)),
                              ]);
                            }
                            if (validPaths.length !== toAdd.length) {
                              setMediaError("Some screenshots failed to upload. Please retry.");
                            }
                          } finally {
                            setScreenshotsUploading(false);
                            input.value = "";
                          }
                        })();
                      }}
                    />
                    <span className="text-lg leading-none">+</span>
                    <span>Add screen</span>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Video (Optional)
              </label>
              <input
                value={draft.productVideoUrl}
                onChange={(e) => setDraft((d) => ({ ...d, productVideoUrl: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            {!userId && (
              <p className="text-xs text-amber-700">
                Loading your account. Image upload will enable in a moment.
              </p>
            )}
          </div>
        )}

        {draft.step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Tags &amp; Market Fit</h2>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Help investors find your project by categorizing your tech stack and identifying your
                primary audience.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Project Discovery Tags</div>
              <div className="text-xs text-gray-500 mt-1">
                Add keywords that best describe your project&apos;s industry and tech fit.
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap gap-2 mb-3">
                  {draft.discoveryTags.length ? (
                    draft.discoveryTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-[#EFE7FC] text-[#5A2D8F] px-2.5 py-1 text-xs font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              discoveryTags: d.discoveryTags.filter((t) => t !== tag),
                            }))
                          }
                          className="text-[#5A2D8F]/70 hover:text-[#5A2D8F]"
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No tags yet.</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDiscoveryTag();
                      }
                    }}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30"
                    placeholder="Add tag (e.g. SaaS, Fintech)"
                  />
                  <button
                    type="button"
                    onClick={handleAddDiscoveryTag}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white touch-manipulation"
                    style={{ backgroundColor: THEME.primary }}
                  >
                    + Add tag
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Target Market Analysis</div>
              <div className="text-xs text-gray-500 mt-1">
                Who are you building this for? Define your ideal customer profile.
              </div>
              <textarea
                rows={5}
                value={draft.market}
                onChange={(e) => setDraft((d) => ({ ...d, market: e.target.value }))}
                className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30 resize-y"
                placeholder="Describe your target users, geography, and customer segment."
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">Recommended: 100-300 characters</p>
            </div>
          </div>
        )}

        {draft.step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pitch & Team</label>
              <textarea
                rows={3}
                value={draft.pitchSummary}
                onChange={(e) => setDraft((d) => ({ ...d, pitchSummary: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30 resize-y"
                placeholder="What’s the story? Why you? What traction or milestones do you have?"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Team size</label>
              <input
                value={draft.teamSize}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, teamSize: e.target.value.replace(/\D+/g, "") }))
                }
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30"
                placeholder="e.g. 5, 10, 25"
              />
            </div>
          </div>
        )}

        {saveError && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 mt-6">
          <button
            type="button"
            disabled={draft.step === 1}
            onClick={handleBack}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
          >
            Back
          </button>

          {draft.step < 5 ? (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {isEditMode && (
                <button
                  type="button"
                  onClick={goBackToProjects}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 touch-manipulation"
                >
                  Back to projects
                </button>
              )}
              <button
                type="button"
                onClick={() => void (isPublished ? handleSavePublished() : handleAddToDraft())}
                disabled={loading || mediaUploading || !userId || (isPublished && !hasPublishedChanges)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#5A2D8F] bg-[#EFE7FC] hover:opacity-90 touch-manipulation disabled:opacity-60"
              >
                {loadingAction === "draft" || loadingAction === "save"
                  ? "Saving…"
                  : isPublished
                  ? "Save"
                  : "Add to draft"}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isCurrentStepValid || mediaUploading}
                className="rounded-xl px-5 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:opacity-90 touch-manipulation disabled:opacity-60"
                style={{ backgroundColor: THEME.primary }}
              >
                Next Step
              </button>
            </div>
          ) : isPublished ? (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {isEditMode && (
                <button
                  type="button"
                  onClick={goBackToProjects}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 touch-manipulation"
                >
                  Back to projects
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleSavePublished()}
                disabled={loading || mediaUploading || !userId || !hasPublishedChanges}
                className="rounded-xl px-5 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:opacity-90 touch-manipulation disabled:opacity-60"
                style={{ backgroundColor: THEME.primary }}
              >
                {loadingAction === "save" ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {isEditMode && (
                <button
                  type="button"
                  onClick={goBackToProjects}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 touch-manipulation"
                >
                  Back to projects
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleAddToDraft()}
                disabled={loading || mediaUploading || !userId}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#5A2D8F] bg-[#EFE7FC] hover:opacity-90 touch-manipulation disabled:opacity-60"
              >
                {loadingAction === "draft" ? "Saving…" : "Add to draft"}
              </button>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={loading || !isFullyValid || mediaUploading || !userId}
                className="rounded-xl px-5 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:opacity-90 touch-manipulation disabled:opacity-60"
                style={{ backgroundColor: THEME.primary }}
              >
                {loadingAction === "publish" ? "Publishing…" : "Publish"}
              </button>
            </div>
          )}
        </div>
        {!isEditMode && !isCurrentStepValid && (
          <p className="mt-2 text-xs text-red-600">{currentStepValidationMessage}</p>
        )}
        {draft.step === 5 && !isPublished && !isFullyValid && (
          <p className="mt-2 text-xs text-gray-500">
            Publish is enabled when every step shows as complete (green) in the stepper above—including
            cover image, tags, and market.
          </p>
        )}
      </div>

      {showSubmitSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-xl p-6">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Project published</h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Your project is live for mentors and the community. You can keep editing from your
              listings anytime.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSubmitSuccessModal(false);
                router.push("/dashboard");
                router.refresh();
              }}
              className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: THEME.primary }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

