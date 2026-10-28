/* Textured glTF food + extruded lettering — scroll-directed stage. Edit directly; no build step.
 *
 * One fixed, pointer-transparent canvas covers the viewport.
 *  • Food: a bowl (generated GLB with a photographed, displaced food mound) and two photogrammetry
 *    scans are "anchored" to DOM landing pads (hero stage → story sticker → menu badge). Each frame the
 *    pads' live rects are blended by proximity to the viewport centre, so the objects glide between
 *    sections, trade which one leads, and shrink away once the menu grid arrives.
 *  • Lettering: the hero headline and footer wordmark are real extruded, bevelled Bricolage glyph
 *    geometry that tracks its DOM text pixel-for-pixel, leans toward the pointer, and folds up on scroll.
 * Native scrolling is never intercepted. Dragging, keys and zoom work on the hero pad. */
(() => {
  'use strict';
  const canvas = document.querySelector('#food-scene');
  const wrap = document.querySelector('#scene-wrap');       // hero landing pad + interaction surface
  const hero = document.querySelector('.hero-visual');
  const help = document.querySelector('#scene-help');
  const status = document.querySelector('#scene-status');
  const loading = document.querySelector('#scene-loading');
  const buttons = [...document.querySelectorAll('[data-scene], [data-view]')];
  const NAMES = ['bowl', 'avocado', 'citrus'];
  const LABEL = { bowl:'bowl', avocado:'avocado', citrus:'mandarin' };
  // Ordered landing pads. `lead` is which object stars there; null = the visitor's hero choice.
  const pads = [
    { el: wrap, lead: null },
    { el: document.querySelector('.story-slot'), lead: 'avocado' },
    { el: document.querySelector('.menu-slot'), lead: 'bowl' }
  ].filter(pad => pad.el);

  let renderer, frame = 0, contextLost = false;
  const root = document.documentElement;
  function fallback(message) {
    cancelAnimationFrame(frame); frame = 0;
    root.classList.remove('text3d');
    wrap.classList.remove('scene-ready'); canvas.classList.remove('on'); canvas.hidden = true; loading.hidden = true;
    wrap.tabIndex = -1;
    buttons.forEach(button => { button.disabled = true; });
    help.textContent = status.textContent = message;
  }
  // Policy for weak connections / devices. Override with ?3d=full or ?3d=lite while testing.
  const forced = new URLSearchParams(location.search).get('3d');
  const saveData = forced !== 'full' && (navigator.connection?.saveData === true || forced === 'off');
  const lite = forced === 'lite' || (forced !== 'full' && innerWidth <= 760 && ((navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4));
  if (!window.CTF3D || saveData) {
    fallback(saveData ? 'Food photography shown to respect Data Saver.' : 'Food photography shown. The 3D viewer is unavailable.'); return;
  }
  const { THREE: T, GLTFLoader, RoomEnvironment } = window.CTF3D;
  const FOV = 34, DIST = 7.4, FRAME_UNITS = 4.5;   // 4.5 scene units ≈ one pad height
  let scene, camera, rig, spin, textLayer, environment, shadowTexture;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
    const small = Math.min(innerWidth, innerHeight) < 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.25 : small ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(FOV, 1, 0.1, 30);
    camera.position.set(0, 0, DIST); camera.lookAt(0, 0, 0);
    const pmrem = new T.PMREMGenerator(renderer), studio = new RoomEnvironment();
    environment = pmrem.fromScene(studio, 0.04);
    scene.environment = environment.texture; scene.environmentIntensity = 0.7;
    studio.dispose(); pmrem.dispose();
    const key = new T.DirectionalLight(0xfff8ed, 2.4);
    key.position.set(-3, 5, 6); scene.add(key);
    const rim = new T.DirectionalLight(0xffffff, 1.2);
    rim.position.set(4, 1, -2); scene.add(rim);
    scene.add(new T.HemisphereLight(0xffffff, 0x586640, 1));
    rig = new T.Group(); scene.add(rig);      // placed + scaled onto the active pad
    spin = new T.Group(); rig.add(spin);      // scroll / drag rotation
    textLayer = new T.Group(); scene.add(textLayer);
    // Soft radial blob used as a contact shadow under each floating object.
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grad = g.createRadialGradient(64,64,0,64,64,64);
    grad.addColorStop(0,'rgba(54,34,18,.9)'); grad.addColorStop(.45,'rgba(54,34,18,.38)'); grad.addColorStop(1,'rgba(54,34,18,0)');
    g.fillStyle = grad; g.fillRect(0,0,128,128);
    shadowTexture = new T.CanvasTexture(c); shadowTexture.colorSpace = T.SRGBColorSpace;
  } catch (error) {
    renderer?.dispose(); fallback('Food photography shown. This browser could not start 3D.'); return;
  }

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = root.classList.contains('motion-paused');
  let ready = false, disposed = false, selected = 'bowl';
  let yaw = 0, pitch = 0, zoom = 1, targetYaw = 0, targetPitch = 0, targetZoom = 1;
  let pointerX = 0, pointerY = 0, drag = null, lastTime = 0, phase = 0, introStart = -1;
  let pageX = 0, pageY = 0, tiltX = 0, tiltY = 0;       // window-wide pointer for lettering lean
  let vw = 1, vh = 1, layoutVersion = 0;
  const heroLead = { bowl:1, avocado:0, citrus:0 };
  const models = {}, shadows = {};
  // Composition in pad units for each "who leads" state.
  const layout = {
    bowl: {
      bowl:{position:[0.02,-0.45,0], scale:3.55, rotation:[0.72,0.2,0]},
      avocado:{position:[1.42,1.32,0.5], scale:1.0, rotation:[-0.9,0.4,-0.1]},
      citrus:{position:[-1.38,1.2,0.35], scale:1.05, rotation:[0.16,0.3,0.18]}
    },
    avocado: {
      avocado:{position:[0.18,-0.05,0], scale:3.25, rotation:[-1.1,-0.35,-0.4]},
      citrus:{position:[-1.2,1.18,-0.4], scale:1.05, rotation:[0.16,0.3,0.18]},
      bowl:{position:[1.15,-1.2,-0.5], scale:1.55, rotation:[0.7,0.3,0.1]}
    },
    citrus: {
      citrus:{position:[0.05,0.02,0], scale:3.35, rotation:[0.05,-0.1,-0.16]},
      avocado:{position:[1.18,1.12,-0.5], scale:0.95, rotation:[-0.9,0.4,-0.1]},
      bowl:{position:[-1.15,-1.25,-0.5], scale:1.55, rotation:[0.7,-0.3,-0.1]}
    }
  };
  const FLOOR = -2.1;
  const loader = new GLTFLoader();
  // Models are normal files on a server (assets/models/*.glb). The standalone preview embeds them as
  // data URIs instead, and a local file:// open falls back to model-data.js.
  function embeddedModels() {
    if (window.CTF_MODELS) return Promise.resolve(window.CTF_MODELS);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'model-data.js';
      script.onload = () => resolve(window.CTF_MODELS); script.onerror = reject; document.head.appendChild(script);
    });
  }
  async function fetchModel(name) {
    if (window.CTF_MODELS?.[name]) return (await fetch('data:model/gltf-binary;base64,' + window.CTF_MODELS[name])).arrayBuffer();
    try {
      const response = await fetch(`assets/models/${name}.glb`);
      if (!response.ok) throw new Error(response.statusText);
      return await response.arrayBuffer();
    } catch (error) {
      const embedded = await embeddedModels();
      return (await fetch('data:model/gltf-binary;base64,' + embedded[name])).arrayBuffer();
    }
  }
  function loadModel(name) {
    return fetchModel(name).then(buffer => new Promise((resolve, reject) => loader.parse(buffer, '', gltf => {
      const model = gltf.scene;
      const bounds = new T.Box3().setFromObject(model);
      const size = bounds.getSize(new T.Vector3()), center = bounds.getCenter(new T.Vector3());
      const scale = 1 / Math.max(size.x, size.y, size.z);
      model.scale.multiplyScalar(scale); model.position.copy(center).multiplyScalar(-scale);
      model.traverse(object => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          if (material.map) material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          material.envMapIntensity = 0.8;
        });
      });
      const group = new T.Group(); group.name = name; group.add(model); spin.add(group);
      const shadow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map:shadowTexture, transparent:true, depthWrite:false, depthTest:false, toneMapped:false }));
      shadow.renderOrder = -1; rig.add(shadow);
      group.userData.born = performance.now();
      models[name] = group; shadows[name] = shadow; resolve(group);
    }, reject)));
  }

  /* ---------- 3D lettering ---------- */
  const COLORS = { ink:[0x0c4a2c,0.5], coral:[0xff5a24,0.5], cream:[0xf6f2e7,0.56], lime:[0xd5df79,0.55] };
  const materials = {};
  const lettering = [];   // blocks: { root, mode, group, lines:[{el, marker, mesh, text, key}] }
  // Not tone-mapped so the faces keep the brand colours; the colours are pre-scaled because the
  // scene lights are bright (they are tuned for the food).
  function textMaterial(color) {
    return materials[color] ||= new T.MeshPhysicalMaterial({ color:new T.Color((COLORS[color] || COLORS.ink)[0]).multiplyScalar((COLORS[color] || COLORS.ink)[1]), roughness:0.7, metalness:0, clearcoat:0, specularIntensity:0.18, envMapIntensity:0.08, toneMapped:false });
  }
  // Per-character x offsets (in em) measured from the browser's own layout, so kerning and
  // letter-spacing match the DOM text exactly.
  function measureOffsets(el, fontSize) {
    const node = [...el.childNodes].find(n => n.nodeType === 3), range = document.createRange(), left = el.getBoundingClientRect().left;
    const offsets = [];
    for (let i = 0; i < node.length; i++) { range.setStart(node, i); range.setEnd(node, i + 1); offsets.push((range.getBoundingClientRect().left - left) / fontSize); }
    return offsets;
  }
  function buildTextGeometry(text, offsets) {
    const G = window.CTF_GLYPHS, shapePath = new T.ShapePath();
    [...text].forEach((ch, index) => {
      const glyph = G.glyphs[ch]; if (!glyph) return;
      for (const contour of glyph.c) {
        const path = new T.Path();
        for (let i = 0; i < contour.length; i += 2) {
          const px = contour[i] / G.upm + offsets[index], py = contour[i + 1] / G.upm;
          i ? path.lineTo(px, py) : path.moveTo(px, py);
        }
        path.closePath(); shapePath.subPaths.push(path);
      }
    });
    const geometry = new T.ExtrudeGeometry(shapePath.toShapes(false), { depth:0.11, bevelEnabled:true, bevelThickness:0.012, bevelSize:0.008, bevelOffset:-0.008, bevelSegments:3, curveSegments:1 });
    geometry.translate(0, 0, -0.11);   // front face sits on the DOM plane; the body extrudes away from the viewer
    return geometry;
  }
  function initLettering() {
    if (!window.CTF_GLYPHS || lite) return;   // low-power phones keep the flat DOM text
    const targets = [['.hero h1', 'hero'], ['.footer-wordmark', 'footer'], ['.footer-ig', 'footer'], ...[...document.querySelectorAll('.hs-word')].map(el => [el, 'pan'])];
    targets.forEach(([selector, mode]) => {
      const container = typeof selector === 'string' ? document.querySelector(selector) : selector; if (!container) return;
      const lines = (container.matches('.t3d-line') ? [container] : [...container.querySelectorAll('.t3d-line')]).map(el => {
        const marker = document.createElement('i');   // zero-size baseline probe
        marker.setAttribute('aria-hidden', 'true'); marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        el.appendChild(marker);
        const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
        return { el, marker, text, mesh:null, key:'', ver:-1, fs:0, baseOff:0 };
      });
      const group = new T.Group(); textLayer.add(group);
      lettering.push({ root:container, mode, group, lines });
    });
    if (lettering.length) root.classList.add('text3d');
  }
  function updateLettering(time, upp, sceneVisible) {
    let any = false;
    const smooth01 = (a, b, x) => smooth(a, b, x);
    for (const block of lettering) {
      const rect = block.root.getBoundingClientRect();
      const on = rect.bottom > -40 && rect.top < vh + 40 && rect.right > -80 && rect.left < vw + 80 && rect.width > 8;
      block.group.visible = on; if (!on) continue; any = true;
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      block.group.position.set((cx - vw / 2) * upp, -(cy - vh / 2) * upp, 0);
      const lean = paused ? 0 : 1;
      const leanScale = block.mode === 'hero' ? 1 : 0.55;   // big words lean less
      let rx = -tiltY * 0.16 * lean * leanScale, ry = tiltX * 0.26 * lean * leanScale;
      if (block.mode === 'pan') ry += ((cx - vw / 2) / vw) * -0.5 * lean;   // words swing as they cross the viewport
      if (block.mode === 'hero') rx -= smooth01(0, 1, scrollY / (vh * 0.75)) * 0.9 * (paused ? 0 : 1);
      else if (block.mode === 'footer') rx += (1 - smooth01(0, 1, (vh - rect.top) / (vh * 0.3))) * 1.15 * (paused ? 0 : 1);
      block.group.rotation.set(rx, ry, 0);
      block.lines.forEach((line, i) => {
        const lr = line.el.getBoundingClientRect(), width = Math.round(lr.width);
        if (line.ver !== layoutVersion && width > 4) {   // style/measure work only after a resize or font load
          line.ver = layoutVersion;
          line.fs = parseFloat(getComputedStyle(line.el).fontSize);
          line.baseOff = line.marker.getBoundingClientRect().bottom - lr.top;
          const key = `${line.fs}|${width}|${line.text}`;
          if (key !== line.key) {
            line.key = key; line.mesh?.geometry.dispose();
            const geometry = buildTextGeometry(line.text, measureOffsets(line.el, line.fs));
            if (!line.mesh) { line.mesh = new T.Mesh(geometry, textMaterial(line.el.dataset.color)); block.group.add(line.mesh); }
            else line.mesh.geometry = geometry;
          }
        }
        if (!line.mesh) return;
        const fs = line.fs, base = lr.top + line.baseOff;
        const fold = reducedQuery.matches || paused || introStart < 0 ? 0 : 1 - backOutSoft(T.MathUtils.clamp((time - introStart - 250 - i * 170) / 900, 0, 1));
        line.mesh.scale.setScalar(fs * upp);
        line.mesh.position.set((lr.left - vw / 2) * upp - block.group.position.x, -(base - vh / 2) * upp - block.group.position.y, 0);
        line.mesh.rotation.x = -fold * 1.35;
      });
    }
    return any;
  }

  function schedule() {
    if (!frame && !disposed && !contextLost && ready && !document.hidden) frame = requestAnimationFrame(render);
  }
  const smooth = (a, b, x) => { const t = T.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const backOut = t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const backOutSoft = t => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const v3 = new T.Vector3();
  const leadVector = pad => pad.lead === null ? heroLead : { bowl:+(pad.lead === 'bowl'), avocado:+(pad.lead === 'avocado'), citrus:+(pad.lead === 'citrus') };

  // Blend the pads by how close each one is to the viewport's middle band.
  function placeRig(upp) {
    let sum = 0, sx = 0, sy = 0, ss = 0, conf = 0;
    const lead = { bowl:0, avocado:0, citrus:0 };
    // The focus line starts on the hero pad (so the hero is never pulled toward a nearby section)
    // and drifts to the middle of the viewport as the visitor scrolls.
    const first = pads[0].el.getBoundingClientRect();
    const heroY = Math.min(first.top + scrollY + first.height / 2, vh * 0.85);
    const focus = T.MathUtils.lerp(heroY, vh * 0.5, smooth(0, vh * 0.6, scrollY));
    for (const pad of pads) {
      const r = pad.el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < -vh * 0.6 || r.top > vh * 1.6) continue;
      const cy = r.top + r.height / 2, d = (cy - focus) / (vh * 0.42);
      const w = Math.exp(-d * d), lv = leadVector(pad);
      sum += w; conf = Math.max(conf, w);
      sx += w * (r.left + r.width / 2); sy += w * cy; ss += w * Math.min(r.width, r.height);
      NAMES.forEach(n => { lead[n] += w * lv[n]; });
    }
    if (sum < 1e-4) return { visible: 0, lead };
    const k = 1 / sum;
    NAMES.forEach(n => { lead[n] *= k; });
    // Dip slightly while travelling between pads, and shrink away after the last one.
    const visible = smooth(0.03, 0.32, conf) * (0.62 + 0.38 * smooth(0.3, 0.9, conf));
    rig.position.set((sx * k - vw / 2) * upp, -(sy * k - vh / 2) * upp, 0);
    rig.scale.setScalar(upp * ss * k / FRAME_UNITS * zoom * visible);
    return { visible, lead };
  }

  function render(time) {
    frame = 0;
    if (disposed || contextLost || document.hidden) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 0;
    lastTime = time; if (!paused) phase += dt;
    if (introStart < 0) introStart = time;
    const ease = paused ? 1 : 1 - Math.exp(-dt * 12);
    yaw = T.MathUtils.lerp(yaw, targetYaw, ease); pitch = T.MathUtils.lerp(pitch, targetPitch, ease); zoom = T.MathUtils.lerp(zoom, targetZoom, ease);
    tiltX = T.MathUtils.lerp(tiltX, pageX, ease * 0.6); tiltY = T.MathUtils.lerp(tiltY, pageY, ease * 0.6);
    NAMES.forEach(n => { heroLead[n] = paused ? +(selected === n) : T.MathUtils.lerp(heroLead[n], +(selected === n), 1 - Math.exp(-dt * 5)); });
    const upp = 2 * DIST * Math.tan(T.MathUtils.degToRad(FOV / 2)) / vh;
    const { visible, lead } = placeRig(upp);
    const foodOn = visible > 0.001;
    rig.visible = foodOn;
    const textOn = updateLettering(time, upp, foodOn);
    if (!foodOn && !textOn) { canvas.classList.remove('on'); return; }
    canvas.classList.add('on');
    if (foodOn) {
      const hover = !paused && !drag;
      // Scroll-directed turn: roughly a third of a revolution per viewport of travel.
      const scrollSpin = paused ? 0 : (scrollY / vh) * 2.1;
      spin.rotation.set(pitch + (hover ? pointerY * 0.06 : 0), yaw + scrollSpin + (hover ? pointerX * 0.1 : 0), 0);
      NAMES.forEach((name, i) => {
        const group = models[name]; if (!group) return;
        const intro = paused || reducedQuery.matches ? 1 : T.MathUtils.clamp((time - group.userData.born - i * 120) / 1100, 0, 1);
        const pop = intro >= 1 ? 1 : Math.max(0.0001, backOut(intro));
        const pos = [0, 0, 0], rot = [0, 0, 0]; let scale = 0;
        NAMES.forEach(l => {
          const w = lead[l]; if (w < 1e-3) return;
          const cfg = layout[l][name];
          for (let a = 0; a < 3; a++) { pos[a] += w * cfg.position[a]; rot[a] += w * cfg.rotation[a]; }
          scale += w * cfg.scale;
        });
        group.position.set(pos[0], pos[1] - (1 - pop) * 0.9, pos[2]);
        group.scale.setScalar(scale * pop);
        group.rotation.set(rot[0], rot[1] + (1 - pop) * 2.4, rot[2]);
        if (!paused) {
          const primary = lead[name] > 0.5;
          group.position.y += Math.sin(phase * (primary ? 0.9 : 0.8) + (primary ? 0 : 2 + i)) * (primary ? 0.065 : 0.1);
          if (primary) group.rotation.y += Math.sin(phase * 0.38) * 0.1; else group.rotation.z += Math.sin(phase * 0.6 + i) * 0.08;
        }
      });
      scene.updateMatrixWorld(true);
      NAMES.forEach(name => {
        const group = models[name], shadow = shadows[name]; if (!group) return;
        group.getWorldPosition(v3); rig.worldToLocal(v3);
        const height = Math.max(0, v3.y - FLOOR), lift = T.MathUtils.clamp((height - 1.4) / 3.2, 0, 0.65);
        const width = group.scale.x * 0.95 * (1 - lift * 0.35);
        shadow.position.set(v3.x, FLOOR, -1.4); shadow.scale.set(width, width * 0.16, 1);
        shadow.material.opacity = 0.34 * (1 - lift) * Math.min(1, group.scale.x * 1.6);
      });
    }
    renderer.render(scene, camera);
    const intro = introStart >= 0 && (time - introStart < 1800 || NAMES.some(n => models[n] && time - models[n].userData.born < 1500));
    if (!paused || intro) schedule();
  }
  function resize() {
    vw = Math.max(1, canvas.clientWidth); vh = Math.max(1, canvas.clientHeight); layoutVersion++;
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix(); schedule();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);
  addEventListener('scroll', schedule, { passive:true });
  const relayout = () => { layoutVersion++; schedule(); };
  addEventListener('load', relayout);
  if (document.fonts?.ready) document.fonts.ready.then(relayout);
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || paused) return;
    pageX = event.clientX / innerWidth * 2 - 1; pageY = event.clientY / innerHeight * 2 - 1; schedule();
  }, { passive:true });
  function resetView() { targetYaw = targetPitch = 0; targetZoom = 1; pointerX = pointerY = 0; schedule(); }
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => {
    if (!ready) return;
    selected = button.dataset.scene; hero.dataset.ingredient = selected;
    document.querySelectorAll('[data-scene]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    wrap.setAttribute('aria-label', `Interactive 3D ${LABEL[selected]} scene. Drag to rotate, arrow keys to turn, plus and minus to zoom, Home to reset.`);
    status.textContent = `${LABEL[selected][0].toUpperCase() + LABEL[selected].slice(1)} selected.`; resetView();
  }));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.view === 'reset') { resetView(); status.textContent = 'View reset.'; }
    else { targetZoom = T.MathUtils.clamp(targetZoom + (button.dataset.view === 'in' ? 0.12 : -0.12), 0.78, 1.24); schedule(); }
  }));
  wrap.addEventListener('pointerdown', event => {
    if (!ready || (event.pointerType === 'mouse' && event.button !== 0)) return;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, yaw:targetYaw, pitch:targetPitch};
    wrap.setPointerCapture(event.pointerId); hero.classList.add('is-dragging');
  });
  wrap.addEventListener('pointermove', event => {
    if (drag && drag.id === event.pointerId) {
      targetYaw = drag.yaw + (event.clientX - drag.x) * 0.009;
      targetPitch = T.MathUtils.clamp(drag.pitch + (event.clientY-drag.y)*0.004, -0.6, 0.6); schedule();
    } else if (event.pointerType === 'mouse' && !paused) {
      const rect = wrap.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5; pointerY = (event.clientY - rect.top) / rect.height - 0.5; schedule();
    }
  });
  function endDrag() { drag = null; hero.classList.remove('is-dragging'); }
  wrap.addEventListener('pointerup', endDrag); wrap.addEventListener('pointercancel', endDrag); wrap.addEventListener('lostpointercapture', endDrag);
  wrap.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
  wrap.addEventListener('keydown', event => {
    if (!ready) return;
    const actions = {
      ArrowLeft:()=>{ targetYaw -= 0.2; }, ArrowRight:()=>{ targetYaw += 0.2; },
      ArrowUp:()=>{ targetPitch = Math.max(-0.6,targetPitch-0.1); }, ArrowDown:()=>{ targetPitch = Math.min(0.6,targetPitch+0.1); },
      '+':()=>{ targetZoom = Math.min(1.24,targetZoom+0.1); }, '=':()=>{ targetZoom = Math.min(1.24,targetZoom+0.1); },
      '-':()=>{ targetZoom = Math.max(0.78,targetZoom-0.1); }, Home:resetView
    };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); schedule(); }
  });
  window.addEventListener('ctf:motion', event => { paused = event.detail.paused; if (paused) { pageX = pageY = tiltX = tiltY = 0; } lastTime = 0; schedule(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { lastTime = 0; schedule(); }
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); contextLost = true; fallback('3D paused by your browser. Reload to explore again.');
  });
  const later = window.requestIdleCallback ? fn => requestIdleCallback(fn, { timeout:2500 }) : fn => setTimeout(fn, 600);
  loadModel('bowl').then(() => {
    if (disposed || contextLost) return;
    ready = true; initLettering(); resize();
    wrap.classList.add('scene-ready'); loading.hidden = true; wrap.tabIndex = 0;
    buttons.forEach(button => { button.disabled = false; });
    help.textContent = 'Drag to discover a fresh perspective.';
    status.textContent = '3D bowl ready. Drag or use the arrow keys to rotate. It follows you down the page as you scroll.'; schedule();
    // Avocado and mandarin (about 5 MB together) arrive once the page is idle and pop in when ready.
    later(() => ['avocado', 'citrus'].forEach(name => loadModel(name).then(schedule).catch(() => {})));
  }).catch(() => {
    disposed = true; resizeObserver.disconnect(); renderer.dispose(); environment.dispose();
    fallback('Food photography shown. The 3D scene could not load.');
  });
})();
