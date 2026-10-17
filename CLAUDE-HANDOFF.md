# Claude handoff — Clock To Fit

Paste the prompt below into Claude and attach this project folder or ZIP.

---

Act as a senior creative developer and motion designer. Extend the attached working Clock To Fit website into a polished, high-end interactive restaurant experience. Read every source file before editing. The current project is a concrete starting point, not a request for a new generic landing page.

## Latest user correction — realistic food

The user rejected the cartoon-like SVG food and simple model appearance. The current revision uses real menu-screenshot photography as the default and retains the procedural 3D scene behind a switch. Preserve that correction. Replace low-resolution screenshot crops with original photographs; replace procedural food with detailed textured GLB models before making 3D the default again. Do not substitute new vector drawings or call a tilted photo a fully rotatable object.

## Goal and reference

The reference is https://sweet-tape.com/ . Its design showcase highlights playful 3D objects, big expressive typography, interactive transitions, directional/horizontal scrolling and microinteractions. Study the live reference if your environment permits, but create an original Clock To Fit experience. Do not copy Sweet Tape branding, text, assets or page structure.

The restaurant sells health-focused cafe food. Make the experience feel appetizing, warm, playful and premium. The core line is “It’s a good time to eat well.” Keep the clock/time motif and everyday-good positioning.

## Preserve

- Cream #f6f2e7, forest #193c2e, coral #ed643f, lime #d5df79.
- Bricolage Grotesque headings, DM Sans body, restrained italic serif accents.
- Oversized editorial type, generous whitespace, a food object as the hero, tactile controls.
- Semantic DOM content, accessible menu and phone/Maps actions independent of WebGL.
- Source-grounded business information and visible concept-art labels.
- Reduced-motion behavior and a useful static fallback.

## Next implementation pass

1. Run the current site and fix actual visual or runtime defects first. Inspect mobile before adding effects.
2. Improve the food art. Prefer carefully lit, compressed GLB models for a bowl, pizza, and a multigrain sub. Replace the procedural geometry only when better models are available. Otherwise refine it honestly; do not claim simple geometry is photorealistic.
3. Build one coherent 3D scroll story: ingredients drift in, assemble into the hero bowl, then settle as the next section arrives. Keep reading and navigation usable. Do not hijack scrolling or trap the user.
4. Animate switching between dishes with a short controlled turn/scale transition. Preserve user rotation and keyboard support. Add a third submarine model only if it improves the art quality.
5. Add subtle tactile button and card interactions for fine-pointer devices. Keep the native cursor, visible focus and ordinary touch behavior. Avoid blanket cursor replacement, noisy particles, autoplay audio and heavy intro loaders.
6. Connect scroll choreography with GSAP/ScrollTrigger if justified. Three.js with vanilla JS is sufficient; React Three Fiber is optional only if there is a concrete maintainability benefit. Keep modules readable.
7. Keep menu data editable in one place, source prices accurately, and preserve the dish-detail dialog and filtering.
8. Keep screenshot-derived photographs labelled as category examples until original, owner-approved exact-dish photographs replace them.

## Business information

- Name: Clock To Fit.
- Address: 5, S Square, opposite Krish Cubical, Thaltej, Ahmedabad, Gujarat 380059.
- Telephone: +91 76220 05509.
- Supplied listing: 4.4 stars, 212 reviews, ₹400–600 per person; snapshot only.
- Supplied services: dine-in, drive-through, no-contact delivery.
- Menu facts and 14 prices are in `script.js` and `docs/CONTENT-SOURCES.md`.
- Do not invent calorie counts, protein amounts, dietary guarantees, certifications, opening hours, testimonials, sales or business history.
- Do not describe the whole restaurant as vegetarian: the menu screenshot contains an Eggs category elsewhere. The illustrated dishes are vegetarian concepts, not a dietary certification.
- Do not add fake order confirmation or reservations. Use phone enquiry until the owner provides and authorizes real endpoints.

## Performance and accessibility

- Use a single WebGL renderer; cap DPR around 1.5–2 and offer lighter rendering on small devices.
- Use instancing/shared geometry and compressed textures/models. Pause animation when hidden/offscreen.
- Content must remain readable without WebGL. Touch scrolling must remain natural.
- Honor prefers-reduced-motion and the user motion toggle for JS and CSS animations.
- Keyboard users must rotate/switch the dish, navigate the menu, close dialogs with Escape, and recover focus.
- Verify 1440px, 1024px, 768px, 390px, 360px; check overflow, contrast and tap targets.
- Inspect WebGL context loss and unavailable/deferred assets.

## Delivery

Implement the next pass, not just a plan. Return the revised source, a concise change summary, what was actually tested, and known limitations. Preserve the original as a checkpoint. Explain which features require owner-provided assets or services. The target is a crafted food experience; avoid dashboards, generic SaaS cards, invented reviews or stock feature sections.

---

## Owner inputs that would materially improve the final site

1. Original logo/brand files and approval to use the restaurant identity.
2. Current complete menu, prices, tax/service details, allergens and dietary options.
3. Owner-approved food and interior photos, or permission for a product shoot.
4. Confirmed weekly opening hours and phone number.
5. Official delivery/ordering links and reservation process.

These are publication-stage content needs. They do not prevent further visual prototyping.
