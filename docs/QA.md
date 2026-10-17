# Verification record

Passed JavaScript syntax checks and 19 non-browser checks using jsdom:

- Local HTML/CSS asset paths and unique IDs/fragment links.
- Featured menu and all 14 dishes, category counts and selected source prices.
- Dish dialog content, close behavior and restored focus.
- Mobile navigation state and close-on-selection.
- Motion toggle state.
- Bundled Three.js revision 160 loads.
- Scene construction using real Three.js geometry with a renderer adapter.
- Finite geometry/instance transforms: 207 meshes, 600 instanced food pieces.
- Scene switching, toss and keyboard event paths.
- Paused interaction does not schedule continuous frames.
- Missing-library fallback and disabled 3D controls.
- Phone and outbound map link targets.

These checks used a DOM simulation and a renderer adapter. They do not verify actual GPU rendering, frame rate, pixels, responsive visual appearance, native dialog accessibility, or real-device gestures. A permitted live browser-control tool was unavailable. Those checks are still required before public release.

The standalone preview embeds the same validated source and all assets. It is a generated convenience copy; edit the separate HTML, CSS and JS files.

## Photo revision checks

Verified photo-first default state; photo/model toggling and accessible control state; local photographic assets in menu/dialog; and photograph switching with WebGL unavailable. Photographic crop CSS was checked against the supplied screenshot dimensions; actual browser layout and image sharpness remain unverified.
