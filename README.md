# Clock To Fit — textured 3D edition

A plain HTML, CSS and JavaScript restaurant concept with real-time Three.js, two photographic 3D scans, and sharp food photography. Prepared 17 October 2026.

## Open it

Open `Clock-To-Fit-Preview.html` in a current Chrome, Edge, Firefox or Safari browser. It contains the fonts, photos, models and runtime in one file. Download the HTML first if your file preview does not execute JavaScript.

For editing, open `index.html` from the extracted folder. All dependencies are local. No API key, npm install, internet connection or server is required for the included page. External phone, Maps and source-credit links naturally use their respective apps or websites.

## What changed

- Scroll-directed stage: the two scans follow you from the hero to a sticker on the story photo and a badge beside the menu heading, swapping which ingredient leads, then shrink away. Native scrolling is untouched; they have a pop-in reveal and soft contact shadows.

- Replaced both simple procedural food models and the screenshot-based photo stage.
- Added a public-domain avocado photogrammetry scan and a textured mandarin scan, rendered as real geometry with Three.js r180 and GLTFLoader.
- Drag or use arrow keys to turn the scene. Use + / − to zoom and Home to reset. The on-screen controls also work without dragging.
- Choose Avocado or Citrus to change the featured ingredient. Both models are visible in the scene.
- Added licensed, locally stored photographs for bowls, pizza and sandwiches. These are representative stock photos, not exact menu-item photographs.
- Kept 14 supplied menu entries, filters, dish dialogs, mobile navigation, phone and Google Maps links.
- Respects reduced motion, offers a pause button, and stops rendering when off-screen or in a hidden tab.
- Falls back to a sharp food photograph if the 3D runtime or model loading fails.

## Edit these files

| File | Purpose |
| --- | --- |
| `index.html` | Layout, business details, copy and visible asset credits |
| `style.css` | Responsive cream / forest / coral design |
| `script.js` | Menu data, photos, dialogs and navigation |
| `scene.js` | Three.js lighting, staging, loading and interaction |
| `assets/models/` | Ready-to-use textured GLB files |
| `assets/photos/` | Licensed food photography |
| `model-data.js` | Generated embedded model bytes for direct file opening |
| `vendor/three-runtime.js` | Bundled Three.js and GLTFLoader runtime |
| `tools/package.py` | Rebuild embedded assets, standalone preview and ZIP |
| `CLAUDE-HANDOFF.md` | Extension brief for Claude |

After editing files or replacing GLBs, run `python3 tools/package.py` from this folder to regenerate the model data, standalone preview and ZIP. The outputs also appear one directory above the project.

You do not need npm to use or edit the page. Only to rebuild the vendor runtime: `npm install`, then `npm run bundle:vendor`. Three.js and esbuild versions are pinned in package.json.

## Facts and imagery

The restaurant information and menu prices are supplied snapshots, not live data. No ordering, reservation or payment backend is implemented. Images and ingredient studies do not establish the ingredients of any specific dish. Keep the credits in `index.html` and see `docs/ASSETS.md` and `docs/CONTENT-SOURCES.md` before changing or publishing content.

## Verification

The included GLBs parse through the bundled loader; their textures decode; menu, dialog, navigation and 3D controls pass programmatic checks. Both model compositions were inspected in an independent offline 3D renderer. Browser/GPU rendering and responsive layouts still need a manual browser pass; see `docs/QA.md`.
