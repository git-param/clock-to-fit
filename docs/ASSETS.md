# Asset register

## Three.js

- Version: 0.160.1, pinned, locally bundled as `vendor/three.min.js`.
- Source: https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js
- License: MIT; notice included at `vendor/THREE-LICENSE.txt`.
- This older UMD build is intentional for a no-build, directly openable HTML handoff. It logs a deprecation notice for the UMD distribution. A production module-based project should evaluate and pin a current supported release and retest it, not silently swap runtime versions.

## Fonts

- Bricolage Grotesque: Google Fonts, static weight 700.
- DM Sans: Google Fonts, static weights 400 and 600.
- Downloaded from fonts.gstatic.com via Google's stylesheet and retained as local TrueType font files.
- SIL Open Font License notices are included in `assets/`.
- Fallback fonts: Arial and Georgia. No external font request is made at runtime.

## Real photographic assets in the current revision

`assets/menu-reference.png` is an unchanged copy of the user-supplied 2047 × 1279 menu screenshot. CSS viewport framing selects its pizza, rice-bowl and grilled-sandwich photographs. Category photos are reused across related menu items and are labelled accordingly. See `PHOTOGRAPHY-REVISION.md` for resolution and exact-dish limitations. No new generated food image is used in this revision.

## Original code-based art

- Proposed wordmark and favicon: inline/local SVG.
- The former SVG menu food drawings have been removed.
- Bowl, pizza, grains, vegetables and floating ingredients: original procedural Three.js geometry in `scene.js`.
- Location illustration: decorative inline SVG, explicitly not a navigational map.

## Previous draft image — no longer used or packaged

File: `assets/food-editorial.png`.

Created with the built-in image-generation tool for this project. It is visibly labelled as concept imagery, not a photograph of actual Clock To Fit food. No restaurant screenshot or reference-site asset was extracted or reused.

Prompt:

> Use case: photorealistic-natural. Asset type: one landscape editorial food photograph for a premium playful Indian healthy-food cafe website, Clock To Fit. Create a high-end overhead studio photograph on a warm vivid coral orange tabletop, featuring one off-white ceramic bowl of brown rice, corn, kidney beans, cherry tomatoes, grilled paneer and greens, a whole-wheat vegetable pizza partly visible on the right edge, and half a multigrain vegetable submarine sandwich partly visible at bottom left. A lime wedge and a casually folded butter-yellow linen napkin. All food vegetarian; no meat or eggs. Natural delicious textures, appetizing beautifully arranged real food, strong side sunlight and crisp natural shadows, magazine food editorial art direction. Main rice bowl at left center, entire image full-bleed with warm coral negative space at upper left. Landscape 3:2 composition. No text, no logo, no watermarks, no packaging. This is illustrative concept imagery, not a photo of actual restaurant products.

Replace this with owner-approved photographs before presenting food appearance as authentic to the restaurant.
