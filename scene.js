/* Textured glTF food studies — scroll-directed stage. Edit directly; no build step needed.
 *
 * One fixed, pointer-transparent canvas covers the viewport. The two scanned models are
 * "anchored" to real DOM landing pads (hero stage → story sticker → menu badge). Every frame
 * the pads' live screen rects are blended by proximity to the viewport centre, so the models
 * glide between sections, trade which ingredient leads, and shrink away once the menu grid
 * arrives. Native scrolling is never intercepted. Dragging, keys and zoom work on the hero pad. */
(() => {
  'use strict';
  const canvas = document.querySelector('#food-scene');
  const wrap = document.querySelector('#scene-wrap');       // hero landing pad + interaction surface
  const hero = document.querySelector('.hero-visual');
  const help = document.querySelector('#scene-help');
  const status = document.querySelector('#scene-status');
  const loading = document.querySelector('#scene-loading');
  const buttons = [...document.querySelectorAll('[data-scene], [data-view]')];
  // Ordered landing pads. `lead` says which ingredient is the hero of the shot there:
  // 1 = avocado, 0 = mandarin, null = whichever the visitor picked in the hero toolbar.
  const pads = [
    { el: wrap, lead: null },
    { el: document.querySelector('.story-slot'), lead: 0 },
    { el: document.querySelector('.menu-slot'), lead: 1 }
  ].filter(pad => pad.el);

  let renderer, frame = 0, contextLost = false;
  function fallback(message) {
    cancelAnimationFrame(frame); frame = 0;
    wrap.classList.remove('scene-ready'); canvas.classList.remove('on'); canvas.hidden = true; loading.hidden = true;
    wrap.tabIndex = -1;
    buttons.forEach(button => { button.disabled = true; });
    help.textContent = status.textContent = message;
  }
  if (!window.CTF3D || !window.CTF_MODELS) {
    fallback('Food photography shown. The 3D viewer is unavailable.'); return;
  }
  const { THREE: T, GLTFLoader, RoomEnvironment } = window.CTF3D;
  const FOV = 34, DIST = 7.4, FRAME_UNITS = 4.5;   // 4.5 scene units ≈ one pad height
  let scene, camera, rig, spin, environment, shadowTexture;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
    const small = Math.min(innerWidth, innerHeight) < 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
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
    // Soft radial blob used as a contact shadow under each floating model.
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grad = g.createRadialGradient(64,64,0,64,64,64);
    grad.addColorStop(0,'rgba(54,34,18,.9)'); grad.addColorStop(.45,'rgba(54,34,18,.38)'); grad.addColorStop(1,'rgba(54,34,18,0)');
    g.fillStyle = grad; g.fillRect(0,0,128,128);
    shadowTexture = new T.CanvasTexture(c); shadowTexture.colorSpace = T.SRGBColorSpace;
  } catch (error) {
    renderer?.dispose(); fallback('Food photography shown. This browser could not start 3D.'); return;
  }

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = document.documentElement.classList.contains('motion-paused');
  let ready = false, disposed = false, selected = 'citrus';
  let yaw = 0, pitch = 0, zoom = 1, targetYaw = 0, targetPitch = 0, targetZoom = 1;
  let pointerX = 0, pointerY = 0, drag = null, lastTime = 0, phase = 0, heroLead = 0, introStart = -1;
  let vw = 1, vh = 1;
  const models = {}, shadows = {};
  // Local composition, expressed in pad units, for "avocado leads" and "mandarin leads".
  const layout = {
    avocado: {
      avocado:{position:[0.18,-0.05,0], scale:3.25, rotation:[-1.1,-0.35,-0.4]},
      citrus:{position:[-1.08,1.14,-0.4], scale:1.13, rotation:[0.16,0.3,0.18]}
    },
    citrus: {
      citrus:{position:[0.05,0.02,0], scale:3.35, rotation:[0.05,-0.1,-0.16]},
      avocado:{position:[1.18,1.12,-0.5], scale:0.95, rotation:[-0.9,0.4,-0.1]}
    }
  };
  const FLOOR = -2.1;
  const loader = new GLTFLoader();
  function loadModel(name) {
    const bytes = Uint8Array.from(atob(window.CTF_MODELS[name]), char => char.charCodeAt(0));
    return new Promise((resolve, reject) => loader.parse(bytes.buffer, '', gltf => {
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
      models[name] = group; shadows[name] = shadow; resolve(group);
    }, reject));
  }
  function schedule() {
    if (!frame && !disposed && !contextLost && ready && !document.hidden) frame = requestAnimationFrame(render);
  }
  const smooth = (a, b, x) => { const t = T.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const backOut = t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const v3 = new T.Vector3();

  // Blend the pads by how close each one is to the viewport's middle band.
  function placeRig() {
    let sum = 0, sx = 0, sy = 0, ss = 0, lead = 0, conf = 0;
    for (const pad of pads) {
      const r = pad.el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < -vh * 0.6 || r.top > vh * 1.6) continue;
      const cy = r.top + r.height / 2, d = (cy - vh * 0.5) / (vh * 0.42);
      const w = Math.exp(-d * d);
      pad.w = w; sum += w; conf = Math.max(conf, w);
      sx += w * (r.left + r.width / 2); sy += w * cy; ss += w * Math.min(r.width, r.height);
      lead += w * (pad.lead === null ? heroLead : pad.lead);
    }
    if (sum < 1e-4) return { visible: 0, lead: heroLead };
    const k = 1 / sum, upp = 2 * DIST * Math.tan(T.MathUtils.degToRad(FOV / 2)) / vh;
    // Dip slightly while travelling between pads, and shrink away after the last one.
    const visible = smooth(0.03, 0.32, conf) * (0.62 + 0.38 * smooth(0.3, 0.9, conf));
    rig.position.set((sx * k - vw / 2) * upp, -(sy * k - vh / 2) * upp, 0);
    rig.scale.setScalar(upp * ss * k / FRAME_UNITS * zoom * visible);
    return { visible, lead: lead * k };
  }

  function render(time) {
    frame = 0;
    if (disposed || contextLost || document.hidden) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 0;
    lastTime = time; if (!paused) phase += dt;
    if (introStart < 0) introStart = time;
    const ease = paused ? 1 : 1 - Math.exp(-dt * 12);
    yaw = T.MathUtils.lerp(yaw, targetYaw, ease); pitch = T.MathUtils.lerp(pitch, targetPitch, ease); zoom = T.MathUtils.lerp(zoom, targetZoom, ease);
    const leadTarget = selected === 'avocado' ? 1 : 0;
    heroLead = paused ? leadTarget : T.MathUtils.lerp(heroLead, leadTarget, 1 - Math.exp(-dt * 5));
    const { visible, lead } = placeRig();
    if (visible <= 0.001) { canvas.classList.remove('on'); return; }
    canvas.classList.add('on');
    const hover = !paused && !drag;
    // Scroll-directed turn: roughly a third of a revolution per viewport of travel.
    const scrollSpin = paused ? 0 : (scrollY / vh) * 2.1;
    spin.rotation.set(pitch + (hover ? pointerY * 0.06 : 0), yaw + scrollSpin + (hover ? pointerX * 0.1 : 0), 0);
    const names = Object.keys(models), a = layout.citrus, b = layout.avocado;
    names.forEach((name, i) => {
      const group = models[name], from = a[name], to = b[name];
      const intro = paused || reducedQuery.matches ? 1 : T.MathUtils.clamp((time - introStart - i * 160) / 1100, 0, 1);
      const pop = intro >= 1 ? 1 : Math.max(0.0001, backOut(intro));
      group.position.set(
        T.MathUtils.lerp(from.position[0], to.position[0], lead),
        T.MathUtils.lerp(from.position[1], to.position[1], lead) - (1 - pop) * 0.9,
        T.MathUtils.lerp(from.position[2], to.position[2], lead));
      group.scale.setScalar(T.MathUtils.lerp(from.scale, to.scale, lead) * pop);
      group.rotation.set(
        T.MathUtils.lerp(from.rotation[0], to.rotation[0], lead),
        T.MathUtils.lerp(from.rotation[1], to.rotation[1], lead) + (1 - pop) * 2.4,
        T.MathUtils.lerp(from.rotation[2], to.rotation[2], lead));
      if (!paused && ready) {
        const primary = (name === 'avocado') === (lead > 0.5);
        group.position.y += Math.sin(phase * (primary ? 0.9 : 0.8) + (primary ? 0 : 2)) * (primary ? 0.065 : 0.1);
        if (primary) group.rotation.y += Math.sin(phase * 0.38) * 0.1; else group.rotation.z += Math.sin(phase * 0.6) * 0.08;
      }
    });
    scene.updateMatrixWorld(true);
    names.forEach(name => {
      const group = models[name], shadow = shadows[name];
      group.getWorldPosition(v3); rig.worldToLocal(v3);
      const height = Math.max(0, v3.y - FLOOR), lift = T.MathUtils.clamp((height - 1.4) / 3.2, 0, 0.65);
      const width = group.scale.x * 0.95 * (1 - lift * 0.35);
      shadow.position.set(v3.x, FLOOR, -1.4); shadow.scale.set(width, width * 0.16, 1);
      shadow.material.opacity = 0.34 * (1 - lift) * Math.min(1, group.scale.x * 1.6);
    });
    renderer.render(scene, camera);
    const intro = introStart >= 0 && time - introStart < 1500;
    if (!paused || intro) schedule();
  }
  function resize() {
    vw = Math.max(1, canvas.clientWidth); vh = Math.max(1, canvas.clientHeight);
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix(); schedule();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);
  addEventListener('scroll', schedule, { passive:true });
  // Re-measure once late layout (fonts, menu render) settles.
  addEventListener('load', schedule);
  function resetView() { targetYaw = targetPitch = 0; targetZoom = 1; pointerX = pointerY = 0; schedule(); }
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => {
    if (!ready) return;
    selected = button.dataset.scene; hero.dataset.ingredient = selected;
    document.querySelectorAll('[data-scene]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    wrap.setAttribute('aria-label', `Interactive textured ${selected === 'citrus' ? 'mandarin' : 'avocado'} model. Drag to rotate, arrow keys to turn, plus and minus to zoom, Home to reset.`);
    status.textContent = `${selected === 'citrus' ? 'Mandarin' : 'Avocado'} selected.`; resetView();
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
  window.addEventListener('ctf:motion', event => { paused = event.detail.paused; lastTime = 0; schedule(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { lastTime = 0; schedule(); }
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); contextLost = true; fallback('3D paused by your browser. Reload to explore again.');
  });
  Promise.all([loadModel('avocado'), loadModel('citrus')]).then(() => {
    if (disposed || contextLost) return;
    ready = true; resize();
    wrap.classList.add('scene-ready'); loading.hidden = true; wrap.tabIndex = 0;
    buttons.forEach(button => { button.disabled = false; });
    help.textContent = 'Drag to discover a fresh perspective.';
    status.textContent = '3D ingredients ready. Drag or use the arrow keys to rotate. They follow you down the page as you scroll.'; schedule();
  }).catch(() => {
    disposed = true; resizeObserver.disconnect(); renderer.dispose(); environment.dispose();
    fallback('Food photography shown. The 3D ingredients could not load.');
  });
})();
