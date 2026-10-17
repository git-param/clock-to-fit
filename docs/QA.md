# Verification — 17 October 2026

Passed: local asset paths and HTML fragments; supplied menu prices; 14 items with 7/5/2 category filtering; dish modal content and restored focus; mobile navigation; motion toggle; bundled Three.js r180 and GLTFLoader; both actual GLB geometry buffers parsed; finite model transforms and geometry; textured materials; model selection, zoom, keyboard and reset controls; paused rendering; missing-runtime photo fallback; phone and external-link attributes; embedded texture decoding; photographs at least 1000 px wide.

The WebGL renderer and browser image loader were adapted for the programmatic interaction checks. This does not verify GPU rendering in a browser. Both model compositions were separately rendered and visually inspected using an offline EGL 3D renderer.

Still required before publication: a real-browser pass on desktop and phone for composition, responsive overflow, touch scrolling, model load timing, GPU performance and accessibility. No browser preview was available in this environment. Business information and menu prices require restaurant confirmation before public launch.

## Added 17 October 2026 — scroll-directed stage

Verified in headless Chromium (SwiftShader WebGL) at 1440x900, 820x1100 and 390x844: scene reaches ready state, zero console/page errors, no horizontal overflow, models glide hero -> story sticker -> menu badge and leave before the menu grid, canvas is pointer-transparent so scrolling, filters and dialogs are unaffected. Fixed a phone-only "goodtime" missing-space bug in the hero heading.

Still required: a physical-phone pass for frame rate (the full-viewport canvas is capped at pixel ratio 1.5 on small screens) and touch drag on the hero pad.

## Added 17 October 2026 — bowl and 3D lettering

Verified in headless Chromium (SwiftShader WebGL): bowl.glb parses and renders with its photographed mound; hero headline and footer wordmark meshes align with the DOM text (side-by-side comparison, kerning matched via per-character Range measurements); hero pad stays on the hero near the top of short viewports (tablet fix); models hand off hero -> story -> menu without strays; toolbar (Bowl / Avocado / Citrus), zoom/reset keys, pause toggle, menu filters, dialog, tel link all work; prefers-reduced-motion keeps static face-on lettering; a blocked WebGL context falls back to the DOM headline and the stock photo with no console errors.

Known limits: software rendering is slow, so screenshots needed multi-second settles; real-GPU frame rate and touch drag are untested. Text colours are pre-scaled and not tone-mapped to hold the brand palette, so re-check them if lights change. The 3D lettering covers only the hero headline and footer wordmark; the section headings use a system italic serif that cannot be extruded.
