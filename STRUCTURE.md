# Codebase structure

This app uses **shared utilities and widgets** in one place, and **feature-specific** code in the folder for that feature. Route groups are clear: `(public)`, `(auth)`, `(founder)`, `(admin)`. Auth is Supabase-based; shared UI lives in `components/ui` and `components/nav`, and each area keeps its own `_components/`.

## Shared (used by all folders)

### `lib/`
Shared utilities and config used across the app.

- **`lib/utils.ts`** – Helpers like `cn()` for classnames.
- **`lib/constants.ts`** – `ROLES`, `THEME` colors, etc.
- **`lib/auth.ts`** – Auth helpers (e.g. `getCurrentUser()` using Supabase).
- **`lib/supabase/`** – Supabase clients: `client.ts` (browser), `server.ts` (server), `admin.ts` (service role), `middleware.ts` (session refresh).
- **`lib/db.ts`** – DB client (Prisma when used; currently commented).
- **`lib/permissions.ts`** – Role and gating logic.
- **`lib/validators/`** – Zod schemas.
- **`lib/storage/`** – R2/S3 helpers.

### `components/ui/`
Shared widgets used on public, auth, founder, and admin pages.

- **`Logo`** – InvestMind logo link.
- **`Button`** – Primary/secondary/ghost buttons.
- **`Input`** – Labeled input with optional error.
- **`PasswordInput`** – Password field with show/hide toggle.

### `components/nav/`
Shared navigation.

- **`Header`** – Main nav (public + auth).
- **`Footer`** – Site footer.

---

## Feature-specific (not shared)

Each feature keeps its own **widgets** and **screens** so only that route group uses them.

### Auth: `app/(auth)/`

- **`_components/`** – Auth-only widgets:
  - `AuthLayout` – Split layout + navbar; form left/right, hero panel.
  - `AuthHero` – Hero panel with image.
  - `LoginForm` – Sign in (email, password, remember me, email-sent modal).
  - `SignupForm` – Sign up (email, password, confirm, terms); redirects to complete profile after confirm email.
  - `CompleteProfileForm` – First name, last name, role, age (after first sign-in).
  - `ForgotPasswordForm` – Email → 8-digit code boxes → set new password.
  - `ResetPasswordForm` – Set new password (when arriving via email link).
- **Routes:** `login`, `signup`, `signup/complete`, `forgot-password`, `reset-password`, `verify-email`.

### Founder: `app/(founder)/`

- **`_components/`** – Founder-only widgets:
  - `DashboardShell` – Sidebar + main area.
  - `DashboardWelcome` – Dashboard overview block.
- **`dashboard/page.tsx`** – Dashboard route (thin; uses `_components`).
- **`listings/`**, **`documents/`**, **`messages/`** – Each can have its own `_components` and thin `page.tsx` files.

### Admin: `app/(admin)/`

- **`admin/`** – Admin routes. Add **`_components/`** here for admin-only widgets and keep each `page.tsx` thin.

### Public: `app/(public)/`

- **Landing, explore, legal** – Shared UI (e.g. `Header`, `Footer`) and optional **`_components/`** for public-only widgets (e.g. hero, sections).

---

## Rules of thumb

1. **Shared** → `lib/` or `components/ui/` (or `components/nav/`).
2. **Used only in one feature** → That feature’s `_components/` (e.g. `(auth)/_components`, `(founder)/_components`).
3. **Route files** (`page.tsx`) stay **thin**: they import from `_components` and shared UI, not big inline JSX.
4. **New features** (e.g. investor) get their own route group and their own `_components/` folder.
