/* Clock To Fit — interaction layer. No build step or network calls required. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reducedMotion.matches;
  const motionButton = $('.motion-toggle');
  function updateMotion() {
    document.documentElement.classList.toggle('motion-paused', motionPaused);
    motionButton.setAttribute('aria-pressed', String(motionPaused));
    motionButton.setAttribute('aria-label', motionPaused ? 'Resume motion' : 'Pause motion');
    motionButton.title = motionPaused ? 'Resume motion' : 'Pause motion';
    motionButton.firstElementChild.textContent = motionPaused ? '▷' : 'Ⅱ';
    window.dispatchEvent(new CustomEvent('ctf:motion', { detail: { paused: motionPaused } }));
  }
  motionButton.addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
  reducedMotion.addEventListener('change', (event) => { motionPaused = event.matches; updateMotion(); });
  updateMotion();

  const navToggle = $('.nav-toggle');
  const mobileNav = $('#mobile-nav');
  function closeNav() {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
    mobileNav.hidden = true;
  }
  navToggle.addEventListener('click', () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    navToggle.setAttribute('aria-expanded', String(opening));
    navToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
  });
  $$('#mobile-nav a').forEach((link) => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
  document.addEventListener('click', (e) => { if (!mobileNav.hidden && !mobileNav.contains(e.target) && !navToggle.contains(e.target)) closeNav(); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', (e) => { if (e.matches) closeNav(); });

  let scrollQueued = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    $('.scroll-progress').style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    scrollQueued = false;
  }
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveals.unobserve(entry.target); }
    }), { threshold: 0.08 });
    $$('.reveal').forEach((el) => reveals.observe(el));
    document.documentElement.classList.add('js-reveal');
  }

  // Transcribed from the user's menu screenshot. Never treat these as live prices.
  const menu = [
    { id:'mexican', name:'Mexican Hot Pot', price:450, category:'bowls', description:'Brown rice with tomato salsa, beans, corn and Mexican herbs.', color:'#dee1bf' },
    { id:'garden', name:'Garden Fresh Vegetable Pizza', price:440, category:'pizza', description:'Whole-wheat thin crust with bell pepper, zucchini, cherry tomatoes, mushrooms, onions and olives.', color:'#efd0b9' },
    { id:'spicy', name:'Spicy Submarine', price:255, category:'subs', description:'A 6-inch multigrain French loaf with bell peppers, onions and spring onions in homemade schezwan sauce.', color:'#e5d5bc' },
    { id:'sizzling', name:'Sizzling Brown Rice', price:485, category:'bowls', description:'Brown rice and boiled vegetables topped with hot and sour sauce.', color:'#d8dec8' },
    { id:'pesto', name:'Pesto Pizza', price:460, category:'pizza', description:'Whole-wheat thin crust with pesto, vegetables, mozzarella and paneer.', color:'#d5ddbd' },
    { id:'jain-sub', name:'Chargrilled Vegetable Sub', price:255, category:'subs', description:'Garden-fresh sautéed vegetables in a multigrain sub. Listed as a Jain option in the supplied menu; confirm preparation with the restaurant.', color:'#e8cdb5' },
    { id:'khichdi', name:'Brown Rice Khichdi', price:320, category:'bowls', description:'Brown rice with fresh vegetables, served with a side of vegetable raita.', color:'#e7d6b6' },
    { id:'green-khichdi', name:'Healthy Green Khichdi', price:345, category:'bowls', description:'Brown rice khichdi in spinach gravy, served with a side of vegetable raita.', color:'#ced9b5' },
    { id:'blue-pea', name:'Blue Pea Rice with Red Thai Curry', price:470, category:'bowls', description:'Blue pea brown rice with broccoli, bell peppers, paneer, basil and carrot in a coconut-milk red Thai curry.', color:'#d5d5df' },
    { id:'broken-wheat', name:'Broken Wheat Khichdi', price:300, category:'bowls', description:'Broken wheat with mixed dal and boiled vegetables, served with vegetable raita.', color:'#e1d7bd' },
    { id:'pulao', name:'Vegetable Pulao', price:290, category:'bowls', description:'Vegetable pulao from the brown rice section of the supplied menu. Ask the restaurant for ingredient details.', color:'#dbe0ba' },
    { id:'margherita', name:'Margherita Pizza', price:355, category:'pizza', description:'The classic Margherita on an 8-inch whole-wheat thin crust.', color:'#e6c7b2' },
    { id:'americano', name:'Americano Pizza', price:460, category:'pizza', description:'Whole-wheat thin crust with corn, mushrooms, olives and jalapeños.', color:'#e2cba9' },
    { id:'paneer', name:'Peppy Paneer Pizza', price:440, category:'pizza', description:'Tri-coloured bell peppers, onions and cottage cheese on a whole-wheat pizza crust.', color:'#e6c1a8' },
  ];
  const categoryLabels = { bowls:'Brown rice & comfort bowls', pizza:'Whole-wheat thin crust · 8 inches', subs:'Multigrain French loaf · 6 inches' };
  const categoryShort = { bowls:'Brown rice', pizza:'Whole-wheat pizza', subs:'Multigrain submarine' };
  let currentFilter = 'all';
  let expanded = false;

  // Real photographs from the user-supplied menu screenshot. CSS framing keeps
  // the original file unchanged. These are category examples, not exact SKU photos.
  function dishPhoto(kind) {
    const labels = { bowls:'Rice bowl photograph from the supplied Clock To Fit menu screenshot', pizza:'Pizza photograph from the supplied Clock To Fit menu screenshot', subs:'Grilled sandwich photograph from the supplied Clock To Fit menu screenshot; category example, not a submarine photo' };
    const captions = { bowls:'Bowl category photo', pizza:'Pizza category photo', subs:'Sandwich category photo' };
    return `<div class="food-photo food-photo--${kind}" role="img" aria-label="${labels[kind]}"><img src="assets/menu-reference.png" alt="" width="2047" height="1279" loading="lazy"><span class="photo-type">${captions[kind]}</span></div>`;
  }

  const dialog = $('#dish-dialog');
  let lastDishTrigger;
  function showDish(id, trigger) {
    const dish = menu.find((item) => item.id === id);
    if (!dish) return;
    lastDishTrigger = trigger;
    $('#dish-title').textContent = dish.name;
    $('#dish-description').textContent = dish.description;
    $('#dish-price').textContent = `₹${dish.price}`;
    $('#dish-category').textContent = categoryShort[dish.category].toUpperCase();
    $('#dialog-art').innerHTML = dishPhoto(dish.category);
    $('#dialog-art').style.background = dish.color;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    $('.dialog-close').focus();
  }
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    lastDishTrigger?.focus({ preventScroll:true });
  });
  function renderMenu(announce = false) {
    const filtered = currentFilter === 'all' ? menu : menu.filter((dish) => dish.category === currentFilter);
    const visible = currentFilter === 'all' && !expanded ? filtered.slice(0,6) : filtered;
    $('#menu-grid').innerHTML = visible.map((dish) => {
      const index = menu.indexOf(dish);
      return `<article class="dish-card"><button type="button" class="dish-open" data-dish="${dish.id}" aria-label="View ${dish.name}, ₹${dish.price}"><div class="dish-art" style="--card-bg:${dish.color}"><span class="dish-number">${String(index + 1).padStart(2,'0')} /</span>${dishPhoto(dish.category)}<span class="dish-plus" aria-hidden="true">+</span></div><div class="dish-info"><h3>${dish.name}</h3><span class="dish-price">₹${dish.price}</span></div><p class="dish-kind">${categoryLabels[dish.category]}</p></button></article>`;
    }).join('');
    $('#show-all').hidden = currentFilter !== 'all';
    $('#show-all').innerHTML = `${expanded ? 'Show the highlights' : 'Explore all 14 dishes'} <span aria-hidden="true">${expanded ? '↑' : '↗'}</span>`;
    if (announce) $('#menu-status').textContent = `${visible.length} dishes shown. ${currentFilter === 'all' ? 'All categories' : categoryShort[currentFilter]}.`;
    updateProgress();
  }
  $('#menu-grid').addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-dish]');
    if (trigger) showDish(trigger.dataset.dish, trigger);
  });
  $$('.menu-filter button').forEach((button) => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    $$('.menu-filter button').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active',active);
      item.setAttribute('aria-pressed',String(active));
    });
    renderMenu(true);
  }));
  $('#show-all').addEventListener('click', () => {
    expanded = !expanded;
    renderMenu(true);
    if (!expanded) $('#menu').scrollIntoView({ behavior: motionPaused ? 'auto' : 'smooth' });
  });
  renderMenu();
})();
