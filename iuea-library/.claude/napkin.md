# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-05-06] Never auto-commit — always provide message for user to run**
   Do instead: Write the commit message and tell user to run it manually.

2. **[2026-05-06] DB migrations must be run by user — Prisma DB unreachable from Claude env**
   Do instead: Give user exact `npx prisma migrate dev --name <name>` command to run.

3. **[2026-05-06] Flutter requires full restart (not hot reload) after provider/router changes**
   Do instead: After router/provider changes, tell user to stop and `flutter run` fresh.

## Domain Behavior Guardrails
1. **[2026-05-06] Web app is admin-only — no user-facing routes on web**
   Do instead: All regular user features go in mobile app only; web = admin/management.

2. **[2026-05-06] Shimmer animations must use `Shimmer.fromColors` — plain Container boxes look broken**
   Do instead: Import `package:shimmer/shimmer.dart` and wrap with `Shimmer.fromColors`.

3. **[2026-05-06] FAB overlaps MiniPlayer when MiniPlayer shows in the body Column**
   Do instead: Wrap FAB in `Consumer2<PodcastProvider, ReaderProvider>` and add `Padding(bottom: 68)` when mini player is visible.

4. **[2026-05-06] Archive.org `format:"PDF"` = scanned/image PDF; `format:"Text PDF"` = readable**
   Do instead: Only accept EPUB or "Text PDF"/"Additional Text PDF" formats; reject raw PDF and items with `_scandata.xml`.

5. **[2026-05-06] Email OTP via Resend — no nodemailer; RESEND_API_KEY + FROM_EMAIL in .env**
   Do instead: Use `const { Resend } = require('resend')` and `resend.emails.send(...)`.

## Shell & Command Reliability
1. **[2026-05-06] `flutter_tts` on Android 11+ needs TTS_SERVICE query in AndroidManifest.xml**
   Do instead: Add `<intent><action android:name="android.intent.action.TTS_SERVICE"/></intent>` in `<queries>` block.

2. **[2026-05-06] Seed script uses `--clear` flag to reset books before re-seeding**
   Do instead: Run `node scripts/seed.js --clear` for a clean seed.

## User Directives
1. **[2026-05-06] Never commit without explicit user request**
   Do instead: Provide commit message for user to run manually; never call `git commit` proactively.
