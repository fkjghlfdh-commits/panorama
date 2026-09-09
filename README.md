# Handoff: 360° Panorama Viewer with Admin Upload & Shareable Links

## Overview

A two-surface web application for reviewing 360° equirectangular panoramas of interior spaces:

- **Admin surface** — an authenticated-style upload console where the owner uploads panorama images, names them, and generates shareable view-only links.
- **Viewer surface** — a public, view-only 360° player that opens when someone follows a shared link. Supports mouse drag, wheel zoom, mobile gyroscope, auto-rotate, keyboard arrows, fullscreen, and view reset.

Primary use case: interior space design review — a designer uploads renders/photos in equirectangular projection and sends links to reviewers.

## About the Design Files

The files bundled here are **design references created in HTML** — a working prototype that shows the intended layout, styling, interactions, and data flow. They are **not production code to copy directly**.

The task is to **recreate these HTML designs in the target codebase's existing environment** (e.g. React + a real backend, Vue + Firebase, Next.js + S3, SwiftUI, etc.) using its established patterns, component library, styling system, and storage backend. If no environment exists yet, pick the most appropriate stack for the project (a common fit here would be Next.js + a blob-storage backend like S3/R2 + a small metadata DB).

The prototype uses **IndexedDB in the browser** to persist uploaded panoramas — this is a stand-in for a real backend. See the "Backend Contract for Production" section below for what to build server-side.

## Fidelity

**High-fidelity (hifi).** Colors, typography, spacing, radii, shadows, and interactions are final. The developer should recreate the UI pixel-perfectly, adapting only the storage/auth layers to real infrastructure.

## Screens / Views

### 1. Admin — Panorama Management (`Admin.html`)

**Purpose:** The owner uploads panoramas, edits their names, previews them, and copies shareable links.

**Layout**
- Page max-width: **1120px**, centered, padding **40px 32px 80px**.
- Header row: title block on the left ("Admin" eyebrow tag → h1 "파노라마 관리" → subtitle), "뷰어 열기 →" ghost button on the right.
- Body: **2-column CSS grid**, `grid-template-columns: 360px 1fr`, `gap: 24px`, `align-items: start`.
  - Left column: **Upload card** (aside).
  - Right column: **Panorama list** (main).
- Below **840px viewport** the grid collapses to a single column.

**Upload card (left)**
- White surface, `1px solid var(--border)`, `border-radius: 10px`, subtle shadow.
- Uppercase section label "업로드" (13px, weight 600, muted color, letter-spacing 0.02em).
- **Dropzone**: dashed border (`1.5px dashed`), radius 10px, padding `32px 20px`, cream tint background (`oklch(0.98 0.003 80)`). Contains a 28px upload SVG icon, primary label "파일을 끌어놓거나 클릭", hint "Equirectangular JPG/PNG · 2:1 비율 권장". On hover or drag-over: border becomes accent color, background tints toward accent.
- **Name field**: label "이름 (선택)", text input with `1px solid var(--border)`, radius 8px, padding `9px 12px`. Focus ring uses accent color at 25% opacity.
- **Indeterminate progress bar** (hidden by default): 4px tall, radius 999px, animates a 30%-wide accent-color segment sliding left→right infinitely.
- **Button row**: primary "저장" (disabled until a file is selected) + secondary "지우기", each `flex:1`, gap 8px.

**Panorama list (right)**
- Empty state: dashed rounded rectangle with a 32px picture icon and text "아직 업로드된 파노라마가 없습니다", 60px vertical padding.
- Populated: CSS grid, `repeat(auto-fill, minmax(260px, 1fr))`, gap 16px.
- **Item card**:
  - Thumbnail (aspect-ratio 2/1, background-image, cover-fit) with a bottom-gradient overlay (25% black → transparent at 40%). Clickable — opens the viewer in a new tab.
  - Meta block: 14px name (weight 500, single-line ellipsis), 11px muted info row showing file size and creation date (relative — "오후 2:14" today, "9월 5" otherwise).
  - Actions row: "공유" button (with 14px upload/share SVG) + "삭제" button (danger color). Both `flex:1`, small text (12px), top-border separator.
  - Hover: card lifts (`translateY(-2px)`), shadow deepens.

**Share dialog** (native `<dialog>`)
- Max width 480px, radius 14px, drop shadow.
- Title "공유 링크 생성됨", subtitle explaining what the link does.
- **Link box**: light-gray rounded container (`oklch(0.97 0.003 80)`) with `1px solid` border, radius 8px, padding 4px. Inside: monospace 12px readonly input + solid-accent "복사" button.
- **Warning tile** below: warm-yellow tint (`oklch(0.97 0.03 80)`), radius 8px, 12px explanatory text about backend requirements.
- Bottom row: "뷰어에서 열기" + ghost "닫기", `flex:1` each.
- Backdrop: `rgba(20,20,30,0.4)` with `backdrop-filter: blur(2px)`.

**Toast**
- Fixed at `bottom: 24px`, horizontally centered.
- Dark pill (`oklch(0.22 0.01 60)`), white text, 13px, padding `10px 18px`, radius 999px, shadow.
- Fades in with a 20px slide-up, auto-dismisses after 2000ms.

### 2. Viewer — Public 360° Player (`View.html`)

**Purpose:** Anyone with the shared link can view the panorama. No upload, no edit, no delete.

**Layout**
- Full-viewport (`inset: 0`), background `#0b0b0f`, `overflow: hidden`.
- WebGL canvas fills the entire viewport.

**Top bar** (overlays the top of the canvas)
- Position fixed top, padding `16px 20px`, `flex space-between`.
- Gradient scrim: `linear-gradient(180deg, rgba(0,0,0,0.35), transparent)`.
- **Title pill** (left): panorama name, 13px weight 500, dark translucent background (`rgba(0,0,0,0.35)`), radius 999px, `backdrop-filter: blur(8px)`, small green status dot before the text (`oklch(0.7 0.15 155)`, 6px).

**Bottom control bar**
- Fixed at `bottom: 24px`, horizontally centered.
- Dark translucent pill (`rgba(0,0,0,0.4)`), `1px solid rgba(255,255,255,0.08)`, radius 999px, `backdrop-filter: blur(12px)`, padding 4px.
- Six 40×40 round buttons:
  1. **Zoom in** (magnifier with +)
  2. **Zoom out** (magnifier with −)
  3. Divider (1px vertical line at 15% white)
  4. **Auto-rotate** (refresh arc icon) — toggle, `.active` state uses 20% white background
  5. **Gyroscope** (globe/orbit icon) — toggle
  6. **Reset view** (sun/compass icon)
  7. **Fullscreen** (bracket corners icon)
- Button hover: 12% white background.

**Loader**
- Fixed overlay, `#0b0b0f`, centered spinner.
- Spinner: 34×34, 2.5px border, 15% white base, white top, `spin 900ms linear infinite`.
- Fades out (`opacity` 400ms) when the image texture is ready.

**Error state**
- Full-screen dark overlay, centered stack:
  - Title "파노라마를 찾을 수 없습니다" (18px, weight 600).
  - Description (muted, `max-width: 380px`) — copy varies by cause: link invalid vs. image failed to load.
  - Ghost link "관리자 페이지로" (13px, `1px solid rgba(255,255,255,0.2)`, radius 999px).

**Ephemeral hint**
- Small pill "드래그해서 둘러보기" centered on screen, appears when the viewer loads, fades out after 2600ms.

## Interactions & Behavior

### Admin
- **Drag-and-drop or click** on the dropzone → file picker opens or the dropped file is accepted.
- Reject anything not `image/*` with a toast: "이미지 파일만 업로드할 수 있습니다".
- On file selection: dropzone primary label swaps to the filename, hint swaps to formatted size, name input auto-fills from the filename (stripped of extension).
- **Save** → generates a JPEG thumbnail (max 480px wide, quality 0.7) client-side, writes the full-size blob + thumbnail + metadata to storage, refreshes the list, opens the Share dialog, resets the form.
- **Share dialog Copy button** → `navigator.clipboard.writeText`, label swaps to "복사됨" for 1500ms then resets. Fallback to `document.execCommand('copy')` when the clipboard API is unavailable.
- **Delete** → native `confirm` prompt, then deletes and shows a "삭제되었습니다" toast.
- **Clicking a thumbnail** → opens `View.html?id=<id>` in a new tab.

### Viewer
- **Drag** (pointer down + move) → yaw/pitch changes. Sensitivity: `0.1° per pixel`. Latitude clamped to `[-85°, 85°]`.
- **Wheel** → FOV changes by `deltaY * 0.05`, clamped to `[30°, 100°]`.
- **Keyboard**:
  - `←` / `→` → yaw ±5°
  - `↑` / `↓` → pitch ±5° (clamped)
  - `+` / `=` → FOV −5° (zoom in)
  - `-` → FOV +5° (zoom out)
- **Auto-rotate** → adds `0.05°` per frame to yaw when the pointer isn't down.
- **Gyroscope** — on tap: request `DeviceOrientationEvent.requestPermission()` if the browser requires it (iOS 13+). If granted, listen for `deviceorientation` and drive yaw from `alpha`, pitch from `beta − 90`.
- **Reset** → `lon=0, lat=0, fov=75`.
- **Fullscreen** → `requestFullscreen` / `exitFullscreen` on the document element.

### Animations & Transitions
- Item card hover: `transform 160ms, box-shadow 160ms`.
- Dropzone hover/dragging: `border-color 120ms, background 120ms`.
- Buttons: `background 120ms, border-color 120ms, transform 60ms`; active state `translateY(1px)`.
- Progress bar keyframe animation: 1.2s ease-in-out infinite.
- Loader spinner: 900ms linear infinite.
- Toast: opacity + translateY 200ms.
- Hint pill: opacity 400ms.
- Loader fade-out: opacity 400ms.

## State Management

### Admin
- `pendingFile: File | null` — currently staged upload.
- `items: PanoramaRecord[]` — list rendered from storage.
- Dialog open/close is driven by the native `<dialog>` element.

### Viewer
- `record: PanoramaRecord | null` — the panorama being viewed.
- `imageUrl: string` — object URL of the blob (or bundled sample fallback).
- `engine.state` — internal to the WebGL engine:
  - `lon`, `lat` — camera angles in degrees
  - `fov` — perspective FOV in degrees, `[30, 100]`
  - `isDown` — is the user dragging
  - `autoRotate: boolean`, `autoSpeed: 0.05°/frame`
  - `gyro: boolean`

## Data & URL Contract

### Panorama record
```ts
type PanoramaRecord = {
  id: string;            // 8-char base36 + short timestamp suffix
  name: string;          // user-provided or filename
  blob: Blob;            // full-size equirectangular image
  thumbBlob: Blob;       // small JPEG for the list thumbnail
  createdAt: number;     // Date.now()
  size: number;          // bytes
};
```

### Shareable URL
`https://<host>/View.html?id=<id>`

The viewer reads `id` from `URLSearchParams`, fetches the record, and initializes the engine. If `id` is missing, the viewer falls back to the most recent panorama, and if none exists, to the bundled sample at `assets/panorama_web.jpg`. If `id` is present but not found, the error state is shown.

## Backend Contract for Production

The prototype persists panoramas in browser-local IndexedDB, which means a link only works inside the same browser that uploaded it. Warning copy in the Share dialog states this. For production, replace `panorama-store.js` with a real backend:

- `POST /api/panoramas` (admin, authenticated) — multipart upload of the panorama image + name.
  - Server stores the original in blob storage (S3/R2/GCS) and generates a JPEG thumbnail (~480px wide, quality 0.7).
  - Returns `{ id, name, url, thumbUrl, createdAt, size }`.
- `GET /api/panoramas` (admin, authenticated) — list.
- `DELETE /api/panoramas/:id` (admin, authenticated).
- `GET /api/panoramas/:id` (public, no auth) — returns metadata + a signed URL for the image.
- Signed URLs should be long-lived (or the API can proxy the image); the shared link goes stale otherwise.
- Add access controls if the images shouldn't be world-readable (e.g. per-link tokens instead of raw IDs).

## Design Tokens

### Colors
| Token | Value | Use |
|---|---|---|
| `--bg` | `#fafaf7` | Admin page background |
| `--surface` | `#ffffff` | Cards, inputs, dialog |
| `--border` | `oklch(0.92 0.005 80)` | Default 1px borders |
| `--border-strong` | `oklch(0.85 0.006 80)` | Dropzone dashed border, hover states |
| `--fg` | `oklch(0.22 0.01 60)` | Body text, headings |
| `--muted` | `oklch(0.5 0.01 60)` | Secondary text, labels, section eyebrows |
| `--accent` | `oklch(0.62 0.14 260)` | Primary buttons, focus, brand dot |
| `--accent-fg` | `#fff` | Text on accent |
| `--danger` | `oklch(0.6 0.16 25)` | Delete button text |
| `--success` | `oklch(0.6 0.14 155)` | Viewer status dot |
| Viewer bg | `#0b0b0f` | Full-screen dark canvas |
| Viewer overlays | `rgba(0,0,0,0.35–0.4)` | Top bar, control pill |

Hover state for primary button: `oklch(0.55 0.15 260)`.

### Typography
- Font stack: `-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'Segoe UI', system-ui, sans-serif`.
- Base body: **14px / 1.5**, `-webkit-font-smoothing: antialiased`.
- H1 (page title): **22px**, weight 600, letter-spacing `-0.01em`.
- Section eyebrows (`.tag`, card `h2`): **11–13px**, weight 600, uppercase, letter-spacing 0.02–0.08em, muted color.
- Item card name: **14px**, weight 500, single-line ellipsis.
- Item card info: **11px**, muted.
- Buttons: inherit body font, weight 500.
- Dialog title: **16px**, weight 600.
- Monospace (link box): `'SF Mono', Menlo, monospace`, 12px.
- Viewer title: 13px, weight 500, letter-spacing 0.02em.

### Spacing scale
Used values: `4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 60, 80` px.

### Border radius
- Small controls, inputs, warning tile: **8px**
- Cards, dropzone: **10px** (`--radius`)
- Dialog: **14px**
- Pills, toasts, spinner, control buttons: **999px**

### Shadows
- Card: `0 1px 2px rgba(20,20,30,0.04), 0 6px 24px -8px rgba(20,20,30,0.08)` (`--shadow`)
- Card hover: `0 2px 4px rgba(20,20,30,0.05), 0 12px 32px -12px rgba(20,20,30,0.12)`
- Dialog: `0 20px 60px rgba(0,0,0,0.2)`
- Toast: `0 8px 24px rgba(0,0,0,0.2)`

### Icons
Inline SVG, `stroke: currentColor`, `stroke-width: 1.5–2`, round joins/caps, 14–32px depending on context. Roughly Feather/Lucide style — the developer can swap to their icon library and use equivalent glyphs (`upload`, `image`, `share`, `zoom-in`, `zoom-out`, `refresh-cw`, `globe`, `sun` / `compass`, `maximize`).

## Assets

- `assets/panorama_web.jpg` — bundled sample equirectangular panorama used as a fallback when the viewer is opened with no `id` and no saved records. In production, remove or replace with a branded placeholder.

## Files in this bundle

| File | Purpose |
|---|---|
| `Admin.html` | Admin page: upload form, panorama list, share dialog, toast. All admin markup, styles, and glue code inline. |
| `View.html` | Public viewer page: canvas stage, top bar, bottom control bar, loader, error state. |
| `panorama-store.js` | Storage layer — **replace with real API client in production**. Currently uses IndexedDB (`panorama-viewer` DB, `panoramas` store). Exports `savePanorama`, `getPanorama`, `listPanoramas`, `deletePanorama`, `makeThumbnail`. |
| `viewer-engine.js` | Three.js equirectangular renderer. Exports `PanoramaEngine.mount(container, imageUrl, opts)` returning an engine handle with `state`, `setFov`, `setAutoRotate`, `enableGyro`, `disableGyro`, `resetView`, `destroy`. Uses `SphereGeometry(500, 60, 40)` scaled `-1, 1, 1` with a `MeshBasicMaterial` textured by the equirectangular image (`SRGBColorSpace`), camera at origin. |

Three.js is pulled from `https://unpkg.com/three@0.160.0/build/three.min.js`. In a real codebase, install `three` as a dependency and import it properly.

## Notes for the developer

- The IndexedDB warning in the Share dialog is only relevant to the prototype. Remove it once the real backend is wired up.
- Panorama images can be tens of MB. The upload endpoint should accept large multipart bodies, and thumbnail generation should happen server-side (the prototype does it client-side to fit the standalone-HTML constraint).
- The viewer's error copy differentiates two failures: missing record vs. image texture load failure. Keep both messages when porting.
- The `deviceorientation` gyroscope path requires HTTPS on iOS and an explicit user gesture to trigger the permission prompt — hook it to the gyro button click, not to page load.
- Fullscreen behavior differs across browsers; the prototype only calls `requestFullscreen` on `document.documentElement`. If you frame the viewer inside another app shell, target the viewer container instead.
