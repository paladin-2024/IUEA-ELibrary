# Napkin Runbook — IUEA Library

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)

1. **[2026-03-31] Never auto-commit — provide message only**
   Do instead: Write the git commit message and tell the user to run it themselves.

2. **[2026-03-31] TailwindCSS v4 uses `@tailwindcss/vite` plugin, not PostCSS**
   Do instead: Use `@import "tailwindcss"` in CSS; never use `@tailwind base/components/utilities` directives.

3. **[2026-03-31] React stack: Tailwind only, react-icons only, Zustand, api.js — no exceptions**
   Do instead: Never import lucide-react, axios directly, or add inline styles in web/ code.

4. **[2026-03-31] Flutter stack: Provider, Dio, AppColors/AppTextStyles/AppSpacing constants only**
   Do instead: Never hardcode hex colors or use inline TextStyle colors/sizes in Flutter — always use AppColors.* and AppTextStyles.*.

## Domain Behavior Guardrails

1. **[2026-03-31] Design must match screenshots exactly — no generic UI**
   Do instead: Before writing any screen, read the matching screenshot. Match layout, typography weight, color usage, spacing, and component shapes precisely.

2. **[2026-03-31] Brand: primary maroon #7B0D1E, accent gold #C9A84C, surface #FDF6F7, surface-dark #2A0D12**
   Do instead: Map all color references to these tokens; never use arbitrary hex values in code.

3. **[2026-03-31] Desktop layouts use a fixed maroon sidebar (left), content area (right) — not a top nav**
   Do instead: All desktop/web screens share the same left sidebar with IUEA shield + "DIGITAL CURATOR" wordmark, nav items, and logout at the bottom.

4. **[2026-03-31] Mobile uses 5-tab bottom nav: Home, Library, Podcasts, Downloads, Profile**
   Do instead: Match tab order and icons exactly; bottom nav background is white with maroon active indicator.

5. **[2026-03-31] "DIGITAL CURATOR" is the app's identity tagline — appears under logo everywhere**
   Do instead: Always render it as small-caps/uppercase caption beneath the IUEA shield logo, never omit it.

6. **[2026-03-31] AppSpacing constants file was not created in initial scaffolding**
   Do instead: Create `mobile/lib/core/constants/app_spacing.dart` before using any spacing in Flutter widgets.

## Shell & Command Reliability

1. **[2026-03-31] Android emulator maps host localhost to 10.0.2.2 — iOS uses localhost**
   Do instead: Mobile `.env` uses `http://10.0.2.2:5000/api`; never use `localhost` for Android API URLs.

2. **[2026-03-31] `/mnt/skills/public/frontend-design/SKILL.md` does not exist in this environment**
   Do instead: Design guidance comes directly from the screenshots in `/home/nzabanita/Documents/screens/`.
