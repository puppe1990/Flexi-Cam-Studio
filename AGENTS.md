# Agent rules — FlexiCam Studio

Browser camera recorder (Next.js 15 App Router). The live UI is `app/page.tsx` (composer). Session logic lives in `hooks/useStudioSession.ts`. Preview UI lives in `components/studio/`.

## Commands

- Install: `pnpm install` (CI uses pnpm + frozen lockfile)
- One-shot: `pnpm verify` (lint + Prettier + tests)
- Test: `pnpm test` (Vitest + jsdom, no secrets, no camera)
- Format: `pnpm format` / `pnpm format:check`
- Lint: `pnpm lint`
- Dev: `pnpm dev`
- Build: `pnpm build`

## Code style

- Functions: 4–20 lines. Split if longer.
- Files: under 500 lines. Target 200–300.
- **Do not add features inside `app/page.tsx` or grow `hooks/useStudioSession.ts`.** Extract a hook (`hooks/`), a pure module (`lib/`), or a component (`components/studio/`), then wire a thin call site.
- One responsibility per module. Prefer three 250-line files over growing `page.tsx`.
- Names: specific and unique. Avoid `data`, `handler`, `Manager`, `utils` dumping grounds. Prefer symbols with <5 grep hits (`loadScreenshots`, `actuallyTakeScreenshot`).
- Types: import from `types/camera.ts`. Do not redeclare `RecordingState` / `Screenshot` in `page.tsx`. No `any` on public APIs.
- Early returns. Max 2 levels of control-flow indentation.
- Exception messages must include the offending value and expected shape.

## Comments

- Keep WHY / provenance comments. Do not strip them on refactor.
- Write WHY, not WHAT. Skip `// increment counter` above `i++`.
- Docstrings on public `lib/` functions: intent + one usage example.

## Tests

- Tests run with `pnpm test`.
- Every new `lib/` function gets `__tests__/lib/<name>.test.ts`. Bug fixes get a regression test.
- Mock I/O (localStorage, camera, MediaRecorder) with named fakes, not inline stubs.
- Tests must be F.I.R.S.T. Vitest has no camera — keep capture logic testable without a live stream.

## Structure

```
app/page.tsx              # LIVE composer — do not grow
hooks/useStudioSession.ts # session orchestration — split, do not grow
hooks/useStudioZoom.ts
lib/                      # screenshot-storage, video, video-display-area
types/camera.ts
components/studio/        # header, hero, gallery, modal, how-to
components/ui/            # shadcn — do not restyle unless asked
__tests__/                # mirrors lib/ and components/
```

## Dependencies

- Inject storage/media via params when extracting (see `getLocalStorage` in `lib/screenshot-storage.ts`).
- Reuse `SCREENSHOT_STORAGE_KEY`. Do not invent a second localStorage key.

## Formatting

- Prettier + ESLint (lint-staged). Run `pnpm format`. Do not debate style.

## Logging

- Structured fields for debug (`{ action, resolution, error }`). No new emoji `console.log` spam.

## Defensive programming

- localStorage quota: drop oldest screenshots in `saveScreenshots`. Capture must still succeed if persist fails.
- `getUserMedia` denial: set `cameraError` including the browser error `name`.
- MediaRecorder: fall back mime types; never assume `video/mp4`.
- Next.js: touch `localStorage` only after mount (`isMounted`) to avoid hydration mismatch.
