# Claude handoff — Clock To Fit

Continue this existing HTML/CSS/JavaScript concept. The user wants an ambitious, realistic 3D food website inspired by the craft and motion of Sweet Tape (https://sweet-tape.com/). They explicitly allow third-party assets and do not require actual Clock To Fit photographs.

## Non-negotiable visual direction

Use realistic photographed textures and actual 3D geometry. Do not regress to cartoon food assembled from spheres, flat SVG dishes, screenshot crops, or flat pictures tilted and called 3D. The rejected drafts used precisely those treatments.

The current hero uses two genuine food scans: a public-domain avocado by Nodef and a mandarin by zamdreamer with Wayfair PBR textures. The original hand-painted Microsoft avocado has been removed. Sharp stock photographs accompany the menu. The intentional palette is warm cream, forest green, coral and lime; typography is Bricolage Grotesque and DM Sans.

## Start here

1. Open the standalone preview in a browser. Inspect desktop, tablet and phone layouts; that browser visual gate remains outstanding.
2. Read `scene.js`, `script.js` and `docs/ASSETS.md`.
3. Preserve working contact links, menu filters, dialogs, keyboard controls, reduced-motion behavior and loading fallback.
4. Keep the business facts and snapshot prices from `docs/CONTENT-SOURCES.md`. Do not invent live hours, order-provider URLs, nutrition values or ratings.

## Next-level extension opportunities

- DONE: scroll-directed stage. `scene.js` blends DOM landing pads (`#scene-wrap`, `.story-slot`, `.menu-slot`) by proximity to the viewport centre; add a pad to `pads[]` to add a stop. Intro pop-in and canvas contact shadows are in too; profile on a real phone.
- Replace the generated bowl (`tools/make_bowl.py`) with a commercially reusable, photogrammetry-quality bowl or pizza GLB if one can be obtained. Integrate the model itself, its textures and required attribution. Some candidate hosts blocked automated downloads; their files are not included.
- Add restrained model reveal transitions and contact shadows after profiling on a real phone.
- Use actual restaurant ordering/reservation links only after the owner supplies them.

Keep photorealism and appetite appeal above the number of effects. Preserve the lightweight plain-file structure unless the user asks for a framework migration. All current models, photographs and fonts are local; avoid making the page depend on unreliable asset hotlinks.

## Technical details

`vendor/entry.js` bundles Three.js r180, GLTFLoader and RoomEnvironment into a classic IIFE. `model-data.js` holds base64 GLBs so the site can run directly from a file. `GLTFLoader.parse` loads them as actual meshes. Textures use WebP; a modern WebGL2-capable browser is required for 3D. The mandarin uses KHR_materials_diffuse_transmission. Both model files are also included separately under `assets/models/` for editing.

`scene.js` normalizes model bounds, composes the two models, exposes drag / keyboard / zoom / reset interactions, and renders only while visible. It uses ACES tone mapping, a PMREM studio environment and directional lighting. Two ingredient choices switch the staging. Automatic float motion pauses for prefers-reduced-motion and the page pause control.

After changes run `python3 tools/package.py`. Only run npm if modifying the bundled vendor runtime. Before production release, verify the real browser render, mobile performance and content with the restaurant.

## Added: bowl and 3D lettering

`scene.js` now has three models (bowl, avocado, citrus) with `layout[lead]` compositions blended by pad, and `lettering` blocks that extrude `text-data.js` glyphs at the positions of `.t3d-line` DOM spans (hero h1, footer wordmark). The DOM text turns transparent only after the meshes are ready (`html.text3d`). New copy in those elements needs its characters added to `tools/make_text_data.py`.

## Added: horizontal rail, Instagram layer, performance policy

`.hscroll` is a tall section with a sticky stage; `script.js` translates `.hs-track` from vertical progress, and `scene.js` extrudes each `.hs-word` (mode `pan`). `site-config.js` holds owner-supplied links/hours/feed; `tools/build_seo.py` writes the head block, robots/sitemap and share images. `scene.js` loads the bowl first, caches per-line font size/baseline (bump `layoutVersion` after layout changes) and skips 3D lettering on low-power phones or Save-Data. New lettering strings must be added to `tools/make_text_data.py`.
