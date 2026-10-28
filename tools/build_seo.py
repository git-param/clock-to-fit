"""Writes the SEO block into index.html plus robots.txt, sitemap.xml, og-image and apple-touch-icon.
Set "siteUrl" in site.config.json (for example https://clocktofit.in) and rerun to enable the tags that
need an absolute URL (canonical, og:url, og:image, twitter:image, sitemap)."""
from pathlib import Path
import json, re
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
cfg = json.loads((ROOT / 'site.config.json').read_text())
site = cfg.get('siteUrl', '').rstrip('/')
TITLE = "Clock To Fit — It's a good time to eat well."
DESC = "Feel-good food in Thaltej, Ahmedabad: brown rice bowls, whole-wheat thin-crust pizzas and multigrain submarines. Dine-in, drive-through and no-contact delivery."

# ---- social image (1200x630) ----
cream, ink, coral, lime = (246, 242, 231), (25, 60, 46), (237, 100, 63), (213, 223, 121)
img = Image.new('RGB', (1200, 630), cream); d = ImageDraw.Draw(img)
d.ellipse((640, 60, 1160, 580), fill=lime)
bowl = Image.open(ROOT / 'assets/photos/salad.webp').convert('RGB').crop((357, 55, 1157, 855)).resize((440, 440))
mask = Image.new('L', (440, 440), 0); ImageDraw.Draw(mask).ellipse((0, 0, 439, 439), fill=255)
img.paste(bowl, (680, 100), mask)
big = ImageFont.truetype(str(ROOT / 'assets/bricolage.ttf'), 104); small = ImageFont.truetype(str(ROOT / 'assets/dm-sans-semibold.ttf'), 30)
for i, (line, col) in enumerate([("It's a good", ink), ('time to', ink), ('eat well.', coral)]):
    d.text((70, 70 + i * 120), line, font=big, fill=col)
d.text((70, 530), 'CLOCK TO FIT  ·  THALTEJ, AHMEDABAD', font=small, fill=ink)
img.save(ROOT / 'assets/og-image.jpg', quality=88)

# ---- block in index.html ----
ld = {
    '@context': 'https://schema.org', '@type': 'Restaurant', 'name': 'Clock To Fit', 'description': DESC,
    'telephone': '+91 76220 05509', 'priceRange': '₹400–600', 'servesCuisine': ['Healthy food', 'Brown rice bowls', 'Pizza', 'Sandwiches'],
    'address': {'@type': 'PostalAddress', 'streetAddress': '5, S Square, opposite Krish Cubical', 'addressLocality': 'Thaltej, Ahmedabad', 'addressRegion': 'Gujarat', 'postalCode': '380059', 'addressCountry': 'IN'},
    'sameAs': [cfg['instagram']]}
if site: ld['url'] = site + '/'; ld['image'] = site + '/assets/og-image.jpg'
tags = ['<link rel="canonical" href="%s/">' % site] if site else []
tags += ['<meta property="og:type" content="restaurant.restaurant">', '<meta property="og:site_name" content="Clock To Fit">',
         '<meta property="og:locale" content="en_IN">', '<meta property="og:title" content="%s">' % TITLE, '<meta property="og:description" content="%s">' % DESC]
if site: tags += ['<meta property="og:url" content="%s/">' % site, '<meta property="og:image" content="%s/assets/og-image.jpg">' % site,
                  '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
                  '<meta name="twitter:image" content="%s/assets/og-image.jpg">' % site]
tags += ['<meta name="twitter:card" content="summary_large_image">', '<meta name="twitter:title" content="%s">' % TITLE, '<meta name="twitter:description" content="%s">' % DESC,
         '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>']
block = '<!--seo:start-->\n  ' + '\n  '.join(tags) + '\n  <!--seo:end-->'
page = (ROOT / 'index.html').read_text()
page = re.sub(r'<!--seo:start-->.*?<!--seo:end-->', lambda m: block, page, flags=re.S)
(ROOT / 'index.html').write_text(page)

(ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\n' + ('Sitemap: %s/sitemap.xml\n' % site if site else ''))
sm = ROOT / 'sitemap.xml'
if site: sm.write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>%s/</loc></url></urlset>\n' % site)
elif sm.exists(): sm.unlink()
print('seo block written; siteUrl =', site or '(not set: canonical/og:image/sitemap skipped)')
