# Modular structure

The live studio is composed, not a single god file.

- `app/page.tsx` — thin composer
- `hooks/useStudioSession.ts` — session state and capture/record/PIP orchestration
- `hooks/useStudioZoom.ts` — zoom, pan, mirror
- `lib/screenshot-storage.ts` — persist gallery photos in localStorage
- `lib/video-display-area.ts` — letterbox/pillarbox math
- `lib/utils/video.ts` — formatTime, downloadBlob, effects helpers
- `components/studio/` — presentational units under ~500 lines
- `types/camera.ts` — shared domain types
