# Asset provenance — 17 October 2026

The user authorized third-party realistic food imagery. All assets below are bundled locally. No restaurant screenshot crop or generated food illustration remains in the page.

## 3D models

### Avocado photogrammetry scan

- Author: Nodef Open Pipeline / Misfits-Rebels-Outcasts.
- Repository and public-domain declaration: https://github.com/Misfits-Rebels-Outcasts/Public-Domain-USDZ
- Source file: https://raw.githubusercontent.com/Misfits-Rebels-Outcasts/Public-Domain-USDZ/master/usdz/avocado_1.usdz
- License: the creator releases all files in the repository into the public domain, per its README.
- Included file: `assets/models/avocado.glb`.
- Conversion: USDZ mesh and face-varying UVs converted to glTF; vertex normals reconstructed; vertices welded; original 4096 px photographed color texture resized to 2048 px and encoded as WebP. Roughness 0.85, metalness 0. No original image was replaced with a generated texture.
- This is a whole avocado scan, not the rejected hand-painted Microsoft avocado.

### MandarinOrange

- Initial creator: zamdreamer (2015). PBR material: Eric Chadwick / Wayfair (2023).
- Source and full attribution: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MandarinOrange
- Original scan: https://sketchfab.com/3d-models/orange-774bc66d11c24855bf722e35249fddf7
- License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/
- Included file: `assets/models/citrus.glb`.
- Changes: packaged glTF resources into GLB, welded vertices, compressed textures to WebP at up to 2048 px; normalized and staged in the website. Source material maps and diffuse transmission extension retained.
- Required attribution is visible in the website footer disclosure and retained here.

The ingredient studies are decorative concepts, not exact restaurant products or a claim about menu ingredients.

## Photographs — Unsplash License

https://unsplash.com/license permits commercial website use and distribution as part of the website. Do not resell the unmodified images as a separate stock collection. Credit is included voluntarily in the footer.

| Local file | Photographer | Source |
| --- | --- | --- |
| `assets/photos/salad.jpg` | Anna Pelzer | https://unsplash.com/photos/IGfIGP5ONV0 |
| `assets/photos/pizza.jpg` | Ivan Torres | https://unsplash.com/photos/MQUqbmszGGM |
| `assets/photos/sandwich.jpg` | Pille R. Priske | https://unsplash.com/photos/U0PiIS4Uvkc |

The bowl photo is 1400 px wide, pizza 1200 px and sandwich 1000 px. The menu labels them representative category imagery. Do not claim they show an exact Clock To Fit menu item.

## Runtime, fonts and original design

- Three.js 0.180.0, MIT. Full license in `vendor/THREE-LICENSE.txt`. GLTFLoader and RoomEnvironment are bundled from the same package.
- Bricolage Grotesque and DM Sans: SIL Open Font License; copies are beside the font files.
- Logo concept, decorative map, layout and interaction code were prepared for this concept. The map is not navigational; Google Maps provides actual directions.

## Source access limits

Innerscene bowl/pizza models, ambientCG pizza and Poly Haven downloads were researched but not included because downloads were blocked. Only the successfully obtained, inspected and credited files listed above are shipped.
