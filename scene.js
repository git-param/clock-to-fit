/* Textured glTF food studies. Edit directly — no build step needed. */
(() => {
  'use strict';
  const canvas = document.querySelector('#food-scene');
  const wrap = document.querySelector('#scene-wrap');
  const hero = document.querySelector('.hero-visual');
  const help = document.querySelector('#scene-help');
  const status = document.querySelector('#scene-status');
  const loading = document.querySelector('#scene-loading');
  const buttons = [...document.querySelectorAll('[data-scene], [data-view]')];
  let renderer, frame = 0, contextLost = false;
  function fallback(message) {
    cancelAnimationFrame(frame); frame = 0;
    wrap.classList.remove('scene-ready'); canvas.hidden = true; loading.hidden = true;
    buttons.forEach(button => { button.disabled = true; });
    help.textContent = status.textContent = message;
  }
  if (!window.CTF3D || !window.CTF_MODELS) {
    fallback('Food photography shown. The 3D viewer is unavailable.'); return;
  }
  const { THREE: T, GLTFLoader, RoomEnvironment } = window.CTF3D;
  let scene, camera, root, environment;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 0.12, 7.4); camera.lookAt(0, 0, 0);
    const pmrem = new T.PMREMGenerator(renderer), studio = new RoomEnvironment();
    environment = pmrem.fromScene(studio, 0.04);
    scene.environment = environment.texture; scene.environmentIntensity = 0.7;
    studio.dispose(); pmrem.dispose();
    const key = new T.DirectionalLight(0xfff8ed, 2.4);
    key.position.set(-3, 5, 6); scene.add(key);
    const rim = new T.DirectionalLight(0xffffff, 1.2);
    rim.position.set(4, 1, -2); scene.add(rim);
    scene.add(new T.HemisphereLight(0xffffff, 0x586640, 1));
    root = new T.Group(); scene.add(root);
  } catch (error) {
    renderer?.dispose(); fallback('Food photography shown. This browser could not start 3D.'); return;
  }
  let paused = document.documentElement.classList.contains('motion-paused');
  let inView = true, ready = false, disposed = false, selected = 'citrus';
  let yaw = 0, pitch = 0, zoom = 1, targetYaw = 0, targetPitch = 0, targetZoom = 1;
  let pointerX = 0, pointerY = 0, drag = null, lastTime = 0, phase = 0;
  const models = {};
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
      const group = new T.Group(); group.name = name; group.add(model); root.add(group);
      models[name] = group; resolve(group);
    }, reject));
  }
  function schedule() {
    if (!frame && !disposed && !contextLost && inView && !document.hidden) frame = requestAnimationFrame(render);
  }
  function applyLayout() {
    for (const [name, group] of Object.entries(models)) {
      const config = layout[selected][name];
      group.position.fromArray(config.position); group.scale.setScalar(config.scale); group.rotation.set(...config.rotation);
    }
  }
  function render(time) {
    frame = 0;
    if (disposed || contextLost || !inView || document.hidden) return;
    const dt = lastTime ? Math.min((time-lastTime)/1000, 0.04) : 0;
    lastTime = time; if (!paused) phase += dt;
    const ease = paused ? 1 : 1 - Math.exp(-dt * 12);
    yaw = T.MathUtils.lerp(yaw, targetYaw, ease); pitch = T.MathUtils.lerp(pitch, targetPitch, ease); zoom = T.MathUtils.lerp(zoom, targetZoom, ease);
    root.rotation.set(pitch + (!paused && !drag ? pointerY * 0.06 : 0), yaw + (!paused && !drag ? pointerX * 0.1 : 0), 0);
    root.scale.setScalar(zoom); applyLayout();
    if (!paused && ready) {
      models[selected].position.y += Math.sin(phase * 0.9) * 0.065;
      models[selected].rotation.y += Math.sin(phase * 0.38) * 0.1;
      const other = selected === 'avocado' ? 'citrus' : 'avocado';
      models[other].position.y += Math.sin(phase * 0.8 + 2) * 0.1;
      models[other].rotation.z += Math.sin(phase * 0.6) * 0.08;
    }
    renderer.render(scene, camera); if (!paused && ready) schedule();
  }
  function resize() {
    const width = Math.max(1, wrap.clientWidth), height = Math.max(1, wrap.clientHeight);
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.position.z = camera.aspect < 1 ? 7.4 / Math.max(camera.aspect, 0.66) : 7.4;
    camera.updateProjectionMatrix(); schedule();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(wrap);
  let visibilityObserver;
  if ('IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) { lastTime = 0; schedule(); } else { cancelAnimationFrame(frame); frame = 0; }
    }, {rootMargin:'100px'});
    visibilityObserver.observe(wrap);
  }
  function resetView() { targetYaw = targetPitch = 0; targetZoom = 1; pointerX = pointerY = 0; schedule(); }
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => {
    if (!ready) return;
    selected = button.dataset.scene; hero.dataset.ingredient = selected;
    document.querySelectorAll('[data-scene]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    canvas.setAttribute('aria-label', `Interactive textured ${selected === 'citrus' ? 'mandarin' : 'avocado'} model. Drag to rotate, arrow keys to turn, plus and minus to zoom, Home to reset.`);
    status.textContent = `${selected === 'citrus' ? 'Mandarin' : 'Avocado'} selected.`; resetView();
  }));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.view === 'reset') { resetView(); status.textContent = 'View reset.'; }
    else { targetZoom = T.MathUtils.clamp(targetZoom + (button.dataset.view === 'in' ? 0.12 : -0.12), 0.78, 1.24); schedule(); }
  }));
  canvas.addEventListener('pointerdown', event => {
    if (!ready || (event.pointerType === 'mouse' && event.button !== 0)) return;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, yaw:targetYaw, pitch:targetPitch};
    canvas.setPointerCapture(event.pointerId); hero.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (drag && drag.id === event.pointerId) {
      targetYaw = drag.yaw + (event.clientX - drag.x) * 0.009;
      targetPitch = T.MathUtils.clamp(drag.pitch + (event.clientY-drag.y)*0.004, -0.6, 0.6); schedule();
    } else if (event.pointerType === 'mouse' && !paused) {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5; pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    }
  });
  function endDrag() { drag = null; hero.classList.remove('is-dragging'); }
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag); canvas.addEventListener('lostpointercapture', endDrag);
  canvas.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
  canvas.addEventListener('keydown', event => {
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
    ready = true; applyLayout(); resize(); renderer.render(scene,camera);
    wrap.classList.add('scene-ready'); loading.hidden = true;
    buttons.forEach(button => { button.disabled = false; });
    help.textContent = 'Drag to discover a fresh perspective.';
    status.textContent = '3D ingredients ready. Drag or use the arrow keys to rotate.'; schedule();
  }).catch(() => {
    disposed = true; resizeObserver.disconnect(); visibilityObserver?.disconnect(); renderer.dispose(); environment.dispose();
    fallback('Food photography shown. The 3D ingredients could not load.');
  });
})();
