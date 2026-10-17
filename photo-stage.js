/* Photo-first hero. Tilt/parallax is deliberately distinguished from the 3D model. */
(() => {
  'use strict';
  const visual = document.querySelector('.hero-visual');
  const stage = document.getElementById('photo-stage');
  const card = document.getElementById('photo-card');
  const photo = document.getElementById('hero-photo');
  const label = document.getElementById('hero-photo-label');
  const toggle = document.getElementById('view-toggle');
  const model = document.getElementById('scene-wrap');
  const canvas = document.getElementById('food-scene');
  const help = document.getElementById('scene-help');
  const toss = document.getElementById('toss');
  const status = document.getElementById('scene-status');
  const tabs = [...document.querySelectorAll('[data-scene]')];
  let photoMode = true;
  let selected = 'pizza';
  let paused = document.documentElement.classList.contains('motion-paused');
  let frame = 0, x = 0, y = 0;
  const is3DReady = () => model.classList.contains('scene-ready') && !canvas.hidden;
  function paintPhoto() {
    photo.className = `food-photo food-photo--${selected === 'bowl' ? 'bowls' : 'pizza'}`;
    photo.setAttribute('aria-label',`Real ${selected === 'bowl' ? 'rice bowl' : 'pizza'} photograph from the supplied Clock To Fit menu screenshot. Category example.`);
    label.textContent = selected === 'bowl' ? 'A BOWL FULL OF GOOD.' : 'A PIZZA KIND OF DAY.';
  }
  function resetTilt() {
    if(frame)cancelAnimationFrame(frame);
    frame=0;x=0;y=0;
    card.style.setProperty('--photo-x','0deg');card.style.setProperty('--photo-y','0deg');
  }
  function paintView() {
    visual.classList.toggle('photo-mode',photoMode);
    stage.hidden = !photoMode;
    model.setAttribute('aria-hidden',String(photoMode));
    canvas.tabIndex = photoMode ? -1 : 0;
    toss.hidden = photoMode;
    toggle.setAttribute('aria-pressed',String(!photoMode));
    toggle.textContent = photoMode ? 'Explore 3D ↗' : 'Real photo ↗';
    toggle.disabled = !is3DReady();
    help.textContent = photoMode ? 'Real menu photograph · move to tilt' : 'Illustrative 3D model · drag to rotate · Space to toss';
    window.dispatchEvent(new CustomEvent('ctf:view',{detail:{photoMode}}));
    resetTilt();
  }
  toggle.addEventListener('click',()=>{
    if(!is3DReady())return;
    photoMode=!photoMode;paintView();
    status.textContent=photoMode?'Showing a real photograph from the supplied menu.':'Showing the illustrative 3D model.';
  });
  tabs.forEach(button=>{
    // Photography remains switchable even if the WebGL fallback disabled its controls.
    button.disabled=false;
    button.addEventListener('click',()=>{
      selected=button.dataset.scene;
      tabs.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      paintPhoto();
      if(photoMode)status.textContent=`Showing the ${selected} category photograph from the supplied menu.`;
    });
  });
  stage.addEventListener('pointermove',event=>{
    if(paused||event.pointerType!=='mouse')return;
    const rect=stage.getBoundingClientRect();
    x=(event.clientX-rect.left)/rect.width-.5;
    y=(event.clientY-rect.top)/rect.height-.5;
    if(!frame)frame=requestAnimationFrame(()=>{
      frame=0;card.style.setProperty('--photo-y',`${x*10}deg`);card.style.setProperty('--photo-x',`${-y*8}deg`);
    });
  });
  stage.addEventListener('pointerleave',resetTilt);
  window.addEventListener('ctf:motion',event=>{paused=event.detail.paused;resetTilt();});
  canvas.addEventListener('webglcontextlost',()=>{photoMode=true;paintView();tabs.forEach(b=>{b.disabled=false;});});
  paintPhoto();paintView();
})();
