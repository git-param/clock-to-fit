# Clock To Fit — a good time to eat well

A working, photo-first interactive website concept with an optional 3D view for Clock To Fit in Thaltej, Ahmedabad. Plain HTML, CSS and JavaScript, with Three.js bundled locally. No npm installation or build step is required.

## Open it

1. Extract the entire ZIP.
2. Open `index.html` in a current desktop browser. Keep the accompanying files and folders together.
3. Or use VS Code Live Server. An optional local server is `python3 -m http.server 8000` from this folder, then visit `http://localhost:8000`.

For a single portable file, open `Clock-To-Fit-Preview.html`. It embeds all fonts, imagery, styles and scripts. Edit the separate source files rather than the generated preview.

## Photography revision

The hero and menu now use real food photographs framed from the supplied menu screenshot. The default hero offers pointer tilt; choose **Explore 3D** for the original rotatable model. These are different viewing modes. Category photos may show a different dish, and the source screenshot limits sharpness. See `docs/PHOTOGRAPHY-REVISION.md`.

## What works

- Real Three.js WebGL bowl and pizza, constructed from procedural geometry.
- Drag horizontally to rotate; left/right arrow keys also rotate the focused canvas.
- “Give it a toss” or Space animates the ingredients. With motion paused, it makes a discrete rotation instead.
- A dish switcher, soft shadows, subtle floating ingredients and pointer tilt.
- Menu category filters, 14 sourced dishes and prices, and accessible native dialog details.
- Mobile navigation, scroll reveals, continuous typography band, progress indicator and pause-motion control.
- Phone links and Google Maps links; these are user-initiated outbound actions.
- Reduced-motion support, pause outside the viewport, capped pixel ratio and static WebGL fallback.
- Local fonts, local Three.js and local photographic assets. No runtime CDN requirement.

## Source map

| File | Purpose |
| --- | --- |
| `index.html` | Semantic page, content, navigation, dialogs, contact links |
| `style.css` | Design tokens, layout, responsive styles, CSS animation |
| `script.js` | Menu data, filtering, dialogs, navigation and motion preferences |
| `scene.js` | Three.js setup, procedural food models, animation and input handling |
| `photo-stage.js` | Photo/model switcher, real-photo framing and pointer tilt |
| `assets/` | Local fonts, favicon and the supplied menu screenshot |
| `vendor/` | Pinned Three.js 0.160.1 UMD build and its MIT license |
| `CLAUDE-HANDOFF.md` | Copy-ready brief for continuing the concept |
| `docs/CONTENT-SOURCES.md` | Fact provenance, menu transcription and approval needs |
| `docs/ASSETS.md` | Asset provenance, licenses and image-generation prompt |

## Important boundaries

This is an independent website concept, not the restaurant’s approved official site. The wordmark is a proposed treatment. The optional 3D models and decorative map remain concept art. Food photographs are real category examples from the supplied screenshot; they do not verify every exact dish appearance.

Menu prices, the rating/review count, address and services came from the user's supplied listing and screenshot. They have not been verified as live data. The site avoids claiming that the shop is currently open and asks visitors to call for current hours. There is no checkout, reservation submission, WhatsApp integration, backend or payment system. The phone number is not assumed to support WhatsApp.

## Verification

JavaScript syntax, local asset paths, menu counts/prices and non-browser interaction checks are covered in the delivery. The permitted browser-control environment was unavailable, so live WebGL rendering, responsive visual layout, real-device performance and screen-reader behavior still require browser QA. Do not interpret source validation as a passed device test.

Suggested manual checks: 1440px desktop, 768px tablet, 390px and 360px mobile; keyboard navigation and Escape on the dialog; both 3D modes; motion pause; OS reduced motion; WebGL disabled; horizontal dragging without blocking vertical mobile scrolling; all menu filters; external phone/Maps links.

## Going beyond the starter

The largest remaining visual improvement will come from art-directed textured GLB food models and original-resolution, owner-approved dish photography. The current scene is genuinely 3D, but deliberately stylised. Read `CLAUDE-HANDOFF.md` for the next implementation pass. Avoid replacing the concept with a generic card-based restaurant template.
