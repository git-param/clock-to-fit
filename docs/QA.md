# Verification — 17 October 2026

Passed: local asset paths and HTML fragments; supplied menu prices; 14 items with 7/5/2 category filtering; dish modal content and restored focus; mobile navigation; motion toggle; bundled Three.js r180 and GLTFLoader; both actual GLB geometry buffers parsed; finite model transforms and geometry; textured materials; model selection, zoom, keyboard and reset controls; paused rendering; missing-runtime photo fallback; phone and external-link attributes; embedded texture decoding; photographs at least 1000 px wide.

The WebGL renderer and browser image loader were adapted for the programmatic interaction checks. This does not verify GPU rendering in a browser. Both model compositions were separately rendered and visually inspected using an offline EGL 3D renderer.

Still required before publication: a real-browser pass on desktop and phone for composition, responsive overflow, touch scrolling, model load timing, GPU performance and accessibility. No browser preview was available in this environment. Business information and menu prices require restaurant confirmation before public launch.

## Added 17 October 2026 — scroll-directed stage

Verified in headless Chromium (SwiftShader WebGL) at 1440x900, 820x1100 and 390x844: scene reaches ready state, zero console/page errors, no horizontal overflow, models glide hero -> story sticker -> menu badge and leave before the menu grid, canvas is pointer-transparent so scrolling, filters and dialogs are unaffected. Fixed a phone-only "goodtime" missing-space bug in the hero heading.

Still required: a physical-phone pass for frame rate (the full-viewport canvas is capped at pixel ratio 1.5 on small screens) and touch drag on the hero pad.
