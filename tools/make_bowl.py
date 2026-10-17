"""Generate assets/models/bowl.glb: a lathed ceramic bowl plus a displaced food mound.
The food uses a photographic colour texture with baked light, so it is unlit in the GLB
to preserve its original contrast under the bright website studio lights."""
from pathlib import Path
import io, json, struct
import numpy as np
from PIL import Image, ImageEnhance
from scipy.ndimage import map_coordinates, gaussian_filter

ROOT = Path(__file__).resolve().parents[1]
photo = Image.open(ROOT / 'assets/photos/salad.jpg').convert('RGB')
cx, cy, rad = 757, 455, 398
crop = photo.crop((cx - rad, cy - rad, cx + rad, cy + rad)).resize((1024, 1024), Image.LANCZOS)
crop = ImageEnhance.Color(crop).enhance(1.08)
crop = ImageEnhance.Contrast(crop).enhance(1.06)
gray = np.asarray(crop.convert('L'), dtype=np.float32) / 255
def jpg(im, q): b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True); return b.getvalue()
color_jpg = jpg(crop, 90)
coarse = gaussian_filter(gray, 7); coarse = (coarse - coarse.mean()) / (np.abs(coarse - coarse.mean()).max() + 1e-6)

# ---- ceramic bowl (lathe) ----
A, B, YC, T = 1.0, 0.64, 0.72, 0.07          # outer half-width / depth / rim height / wall
Ai, Bi = A - T, B - T
prof = []
for th in np.linspace(0, np.pi / 2, 28):      # inner floor -> rim
    prof.append((Ai * np.sin(th), YC - Bi * np.cos(th)))
for a in np.linspace(0, np.pi, 10)[1:-1]:     # rounded rim
    prof.append((A - T / 2 - np.cos(a) * T / 2, YC + np.sin(a) * T * 0.55))
th0 = np.arcsin(0.40 / A)
for th in np.linspace(np.pi / 2, th0, 28):    # outer wall down to the foot
    prof.append((A * np.sin(th), YC - B * np.cos(th)))
foot_y = YC - B * np.cos(th0)
prof += [(0.40, foot_y * 0.5), (0.385, 0.0), (0.0, 0.0)]
prof = np.array(prof); P = len(prof)
tang = np.gradient(prof, axis=0); tang /= np.linalg.norm(tang, axis=1, keepdims=True) + 1e-9
pn = np.stack([-tang[:, 1], tang[:, 0]], 1)
SEG = 112
phis = np.linspace(0, 2 * np.pi, SEG + 1)
bpos, bnor = [], []
for ph in phis:
    c, s = np.cos(ph), np.sin(ph)
    bpos.append(np.stack([prof[:, 0] * c, prof[:, 1], prof[:, 0] * s], 1))
    bnor.append(np.stack([pn[:, 0] * c, pn[:, 1], pn[:, 0] * s], 1))
bpos = np.concatenate(bpos).astype(np.float32); bnor = np.concatenate(bnor).astype(np.float32)
bidx = []
for i in range(SEG):
    for j in range(P - 1):
        a, b, c, d = i * P + j, (i + 1) * P + j, i * P + j + 1, (i + 1) * P + j + 1
        bidx += [a, c, b, b, c, d]
bidx = np.array(bidx, dtype=np.uint32)
# make sure winding agrees with the analytic normals
tri = bpos[bidx[:3]]; fn = np.cross(tri[1] - tri[0], tri[2] - tri[0])
if np.dot(fn, bnor[bidx[:3]].mean(0)) < 0: bidx = bidx.reshape(-1, 3)[:, ::-1].reshape(-1)

# ---- food mound (displaced disc) ----
YF = 0.56
cos_t = (YC - YF) / Bi; R = Ai * np.sqrt(1 - cos_t ** 2) - 0.004
RINGS, SEGF = 64, 144
fpos, fuv = [(0, 0)], []
rings = [(r, ph) for r in np.linspace(0, 1, RINGS + 1)[1:] for ph in np.linspace(0, 2 * np.pi, SEGF, endpoint=False)]
pts = np.array([(0.0, 0.0)] + [(r * np.cos(ph), r * np.sin(ph)) for r, ph in rings])      # unit disc
u = 0.5 + pts[:, 0] / 2; v = 0.5 + pts[:, 1] / 2
rr = np.linalg.norm(pts, axis=1)
detail = map_coordinates(coarse, [v * 1023, u * 1023], order=1)
h = 0.17 * (1 - rr ** 2.3) + 0.045 * detail * (1 - rr ** 4) * (0.35 + 0.65 * np.clip(1 - rr, 0, 1) ** 0.3)
fp = np.stack([pts[:, 0] * R, YF + h - 0.012, pts[:, 1] * R], 1).astype(np.float32)
fi = []
for i in range(1, RINGS + 1):
    for k in range(SEGF):
        k2 = (k + 1) % SEGF
        if i == 1:
            fi += [0, 1 + k2, 1 + k]
        else:
            a = 1 + (i - 2) * SEGF + k; b = 1 + (i - 2) * SEGF + k2; c = 1 + (i - 1) * SEGF + k; d = 1 + (i - 1) * SEGF + k2
            fi += [a, b, c, b, d, c]
fi = np.array(fi, dtype=np.uint32).reshape(-1, 3)
fn = np.zeros_like(fp)
tr = fp[fi]; face = np.cross(tr[:, 1] - tr[:, 0], tr[:, 2] - tr[:, 0])
if face[:, 1].mean() < 0: fi = fi[:, ::-1]; face = -face
for k in range(3): np.add.at(fn, fi[:, k], face)
fn /= np.linalg.norm(fn, axis=1, keepdims=True) + 1e-9
fuv = np.stack([u, v], 1).astype(np.float32); fi = fi.reshape(-1).astype(np.uint32)

# ---- pack GLB ----
blob = bytearray(); views = []; accessors = []
def add_view(data, target=None):
    while len(blob) % 4: blob.append(0)
    off = len(blob); blob.extend(data); view = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
    if target: view['target'] = target
    views.append(view); return len(views) - 1
def add_acc(arr, ctype, atype, target, minmax=False):
    a = {'bufferView': add_view(arr.tobytes(), target), 'componentType': ctype, 'count': int(len(arr)), 'type': atype}
    if minmax: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    accessors.append(a); return len(accessors) - 1
F, U = 5126, 5125
b_p = add_acc(bpos, F, 'VEC3', 34962, True); b_n = add_acc(bnor, F, 'VEC3', 34962); b_i = add_acc(bidx, U, 'SCALAR', 34963)
f_p = add_acc(fp, F, 'VEC3', 34962, True); f_n = add_acc(fn.astype(np.float32), F, 'VEC3', 34962); f_t = add_acc(fuv, F, 'VEC2', 34962); f_i = add_acc(fi, U, 'SCALAR', 34963)
img_c = add_view(color_jpg)
gltf = {
    'asset': {'version': '2.0', 'generator': 'tools/make_bowl.py'}, 'extensionsUsed': ['KHR_materials_unlit'],
    'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'bowl', 'mesh': 0}],
    'meshes': [{'name': 'bowl', 'primitives': [
        {'attributes': {'POSITION': b_p, 'NORMAL': b_n}, 'indices': b_i, 'material': 0},
        {'attributes': {'POSITION': f_p, 'NORMAL': f_n, 'TEXCOORD_0': f_t}, 'indices': f_i, 'material': 1}]}],
    'materials': [
        {'name': 'ceramic', 'doubleSided': True, 'pbrMetallicRoughness': {'baseColorFactor': [0.20, 0.27, 0.22, 1], 'metallicFactor': 0, 'roughnessFactor': 0.52}},
        {'name': 'food', 'extensions': {'KHR_materials_unlit': {}}, 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0, 'roughnessFactor': 1}}],
    'textures': [{'source': 0, 'sampler': 0}],
    'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
    'images': [{'bufferView': img_c, 'mimeType': 'image/jpeg'}],
    'accessors': accessors, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
js = json.dumps(gltf, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(blob) % 4: blob.append(0)
out = ROOT / 'assets/models/bowl.glb'
out.write_bytes(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + bytes(blob))
print(out.stat().st_size, 'bytes; R=%.3f' % R, 'verts', len(bpos), len(fp))
