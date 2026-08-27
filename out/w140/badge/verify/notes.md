# PR1 .rw-agent-badge CSS verify — 2026-08-27

Vite: `npx vite --host 127.0.0.1 --port 5174 --strictPort` (first bind was IPv6-only `::1`; rebound to IPv4).
Viewport: 1280x720 then 900x720. URL: `http://127.0.0.1:5174/?agent=1` then `http://127.0.0.1:5174/`.
New game + origin [1] Freehold Greenhand. Dock not exercised (413u+ from landing). Station scrim vs badge is CSS-only: badge z-index 40, `.screen-overlay` z-index 20.

## Computed (1280x720, flight, ?agent=1)

- `.rw-agent-badge` is a direct `document.body` child; not under `#hud`.
- `position: fixed; top: 140px; right: 16px; z-index: 40`
- `max-width: 148px` (used width 148px); `max-height: 564px` = `calc(100vh - 156px)` at 720
- Rect: x=1116 y=140 w=148 h=210 (bottom 350)
- Manifest `.rw-resources`: y=14 h=90 bottom=104. Vertical gap 36px. Overlap area 0.
- PWR `.rw-side-col`: y=485. Gap to badge 135px. Overlap area 0.
- `.rw-bottom` overlap area 0.
- `.rw-toasts` computed `right: 168px` (toast right edge 1112; badge left 1116; 4px gutter).
- Live toast `.rw-toast.show` "Heave to. Cargo or hull." at y=70–93, right=1112, visibility visible. Not under badge (x overlap 0; toast above badge).
- Buttons min 44x44; used 119x46. `elementFromPoint` on Enable hits `.rw-agent-badge-btn`.
- ON: `is-on`, border-left 4px solid. OFF after Stop: `is-off`, 4px dashed. Enable restored `is-on`.
- `#hud` z-index 10. Title overlay `#rw-title` z-index 70 (title not dock).

## Colorblind / contrast

- Colorblind-safe palette: `body.rw-colorblind`; badge `--rw-accent: #56B4E9`; title/border `rgb(86, 180, 233)`.
- High contrast: `body.rw-contrast`; badge `--white/#ffffff`, `--panel/rgba(4, 8, 17, 0.94)`, `--panel-edge/rgba(160, 205, 245, 0.6)` match `#hud` tokens.

## Narrow 900x720

- Same pin: top 140, right 16, z-index 40, width 148.
- Badge x=736. Manifest bottom 104. PWR top 485. Overlap areas 0. Toast CSS still `right: 168px`.

## Opt-in without query

- `http://127.0.0.1:5174/` still mounts badge as body child; class `is-off`, state "off".

## Console (Playwright, all navigations, debug)

```
Total messages: 2 (Errors: 0, Warnings: 0)
[DEBUG] [vite] connecting... @ http://127.0.0.1:5174/@vite/client:788
[DEBUG] [vite] connected. @ http://127.0.0.1:5174/@vite/client:911
```

No error/warning. No WAVE boot fail in this session. Info/warning query returned 0 messages.

## Screenshots

- `01-flight-manifest.png`
- `02-flight-bottom-pwr.png`
- `03-colorblind.png`
- `04-contrast.png`
- `05-toast-vs-badge.png` (toast had expired before this shot; live toast measured earlier)
- `06-narrow-900.png`
- `07-no-query-optin-off.png`
- `console.json` (tool summary only)
