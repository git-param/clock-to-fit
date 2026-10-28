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

  const SITE = Object.assign({ instagram:'https://www.instagram.com/clocktofitamd/', handle:'@clocktofitamd', whatsapp:'', zomato:'', swiggy:'', hours:'', feed:[] }, window.CTF_SITE || {});
  const orderLinks = [['whatsapp','Order on WhatsApp'],['zomato','Order on Zomato'],['swiggy','Order on Swiggy']].filter(([key]) => SITE[key]);
  $$('[data-order-links]').forEach((el) => {
    el.innerHTML = orderLinks.map(([key,label]) => `<a class="pill pill-ghost" href="${SITE[key]}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`).join('');
    el.hidden = !orderLinks.length;
  });
  if (SITE.hours) $$('[data-hours]').forEach((el) => { el.textContent = SITE.hours; el.hidden = false; });
  if (orderLinks.length) {   // the dock leads with the first configured order channel
    const [key,label] = orderLinks[0];
    $('#dock')?.insertAdjacentHTML('afterbegin', `<a href="${SITE[key]}" target="_blank" rel="noopener noreferrer"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>${label.replace('Order on ','')}</a>`);
  }
  const badge = $('.ig-badge');   // magnetic hover for the hero follow badge
  if (badge && matchMedia('(pointer:fine)').matches) {
    badge.addEventListener('pointermove', (e) => {
      if (motionPaused) return;
      const r = badge.getBoundingClientRect();
      badge.style.transform = `translate(${(e.clientX - r.left - r.width / 2) / r.width * 16}px,${(e.clientY - r.top - r.height / 2) / r.height * 16}px)`;
    });
    badge.addEventListener('pointerleave', () => { badge.style.transform = ''; });
  }

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


  // Pinned horizontal scroll: the section is tall, its inner stage is sticky, and vertical progress pans the track.
  const hs = $('.hscroll');
  if (hs) {
    const stage = $('.hs-stick', hs), track = $('.hs-track', hs), bar = $('.hs-progress span', hs);
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    function updateHs() {
      if (document.documentElement.classList.contains('motion-paused')) { hs.style.height = ''; track.style.transform = ''; return; }
      const distance = Math.max(0, track.offsetWidth - stage.clientWidth);
      const height = distance + stage.clientHeight;
      if (hs.style.height !== height + 'px') hs.style.height = height + 'px';
      const p = distance ? clamp01(-hs.getBoundingClientRect().top / distance) : 0;
      track.style.transform = `translate3d(${-p * distance}px,0,0)`;
      bar.style.transform = `scaleX(${p})`;
    }
    addEventListener('scroll', updateHs, { passive: true });
    addEventListener('resize', updateHs, { passive: true });
    addEventListener('load', updateHs);
    window.addEventListener('ctf:motion', updateHs);
    document.fonts?.ready.then(updateHs);
    $$('.hs-card img').forEach((img) => img.addEventListener('load', updateHs));
    updateHs();
  }

  // Transcribed from the user's menu screenshot. Never treat these as live prices.
  const menu = [
    { id:'mexican', name:'Mexican Hot Pot', price:450, category:'bowls', description:'Brown rice with tomato salsa, beans, corn and Mexican herbs.', color:'#dee1bf' },
    { id:'garden', name:'Garden Fresh Vegetable Pizza', price:440, category:'pizza', description:'Whole-wheat thin crust with bell pepper, zucchini, cherry tomatoes, mushrooms, onions and olives.', color:'#efd0b9' },
    { id:'spicy', name:'Spicy Submarine', price:255, category:'subs', description:'A 6-inch multigrain French loaf with bell peppers, onions and spring onions in homemade schezwan sauce.', color:'#e5d5bc' },
    { id:'sizzling', name:'Sizzling Brown Rice', price:485, category:'bowls', description:'Brown rice and boiled vegetables topped with hot and sour sauce.', color:'#d8dec8' },
    { id:'pesto', name:'Pesto Pizza', price:460, category:'pizza', description:'Whole-wheat thin crust with pesto, vegetables, mozzarella and paneer.', color:'#d5ddbd' },
    { id:'jain-sub', name:'Chargrilled Vegetable Sub', price:255, category:'subs', description:'Garden-fresh sautéed vegetables in a multigrain sub. Available as a Jain option; please confirm preparation when you order.', color:'#e8cdb5', badge:'Jain option' },
    { id:'khichdi', name:'Brown Rice Khichdi', price:320, category:'bowls', description:'Brown rice with fresh vegetables, served with a side of vegetable raita.', color:'#e7d6b6' },
    { id:'green-khichdi', name:'Healthy Green Khichdi', price:345, category:'bowls', description:'Brown rice khichdi in spinach gravy, served with a side of vegetable raita.', color:'#ced9b5' },
    { id:'blue-pea', name:'Blue Pea Rice with Red Thai Curry', price:470, category:'bowls', description:'Blue pea brown rice with broccoli, bell peppers, paneer, basil and carrot in a coconut-milk red Thai curry.', color:'#d5d5df' },
    { id:'broken-wheat', name:'Broken Wheat Khichdi', price:300, category:'bowls', description:'Broken wheat with mixed dal and boiled vegetables, served with vegetable raita.', color:'#e1d7bd' },
    { id:'pulao', name:'Vegetable Pulao', price:290, category:'bowls', description:'Vegetable pulao made with brown rice. Ask us for ingredient details.', color:'#dbe0ba' },
    { id:'margherita', name:'Margherita Pizza', price:355, category:'pizza', description:'The classic Margherita on an 8-inch whole-wheat thin crust.', color:'#e6c7b2' },
    { id:'americano', name:'Americano Pizza', price:460, category:'pizza', description:'Whole-wheat thin crust with corn, mushrooms, olives and jalapeños.', color:'#e2cba9' },
    { id:'paneer', name:'Peppy Paneer Pizza', price:440, category:'pizza', description:'Tri-coloured bell peppers, onions and cottage cheese on a whole-wheat pizza crust.', color:'#e6c1a8' },
  ];
  const categoryLabels = { bowls:'Brown rice & comfort bowls', pizza:'Whole-wheat thin crust · 8 inches', subs:'Multigrain French loaf · 6 inches' };
  const categoryShort = { bowls:'Brown rice', pizza:'Whole-wheat pizza', subs:'Multigrain submarine' };
  let currentFilter = 'all';
  let expanded = false;

  // Licensed stock food photography; representative category imagery.
  function dishPhoto(kind) {
    const photos = {
      bowls: { file:'salad', alt:'A colourful avocado and chickpea bowl', position:'50% 50%' },
      pizza: { file:'pizza', alt:'A freshly baked cheese pizza on a wooden board', position:'58% 50%' },
      subs: { file:'sandwich', alt:'A fresh vegetable and chickpea sandwich', position:'50% 70%' }
    };
    const photo = photos[kind];
    const src = window.CTF_PHOTOS?.[photo.file] || `assets/photos/${photo.file}.webp`;
    return `<div class="food-photo"><img src="${src}" alt="${photo.alt}" loading="lazy" style="object-position:${photo.position}"></div>`;
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
    $('#dish-badge').hidden = !dish.badge; $('#dish-badge').textContent = dish.badge || '';
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
      return `<article class="dish-card"><button type="button" class="dish-open" data-dish="${dish.id}" aria-label="View ${dish.name}, ₹${dish.price}"><div class="dish-art" style="--card-bg:${dish.color}"><span class="dish-number">${String(index + 1).padStart(2,'0')} /</span>${dishPhoto(dish.category)}<span class="dish-plus" aria-hidden="true">+</span></div><div class="dish-info"><h3>${dish.name}${dish.badge ? ` <span class="dish-badge">${dish.badge}</span>` : ''}</h3><span class="dish-price">₹${dish.price}</span></div><p class="dish-kind">${categoryLabels[dish.category]}</p></button></article>`;
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

  // Feed tiles: illustrative photos linking to the profile until real posts are listed in site-config.js.
  const feedDefaults = [
    { img:'salad', pos:'50% 50%', cap:'Bowl days', r:-3 }, { img:'pizza', pos:'30% 50%', cap:'Slice o’clock', r:2.5 },
    { img:'sandwich', pos:'50% 60%', cap:'Stacked and fresh', r:-2 }, { img:'pizza', pos:'78% 40%', cap:'Thin-crust mood', r:3 },
    { img:'salad', pos:'22% 55%', cap:'Colour on a plate', r:-2.5 }, { img:'sandwich', pos:'60% 30%', cap:'Lunch break', r:2 }
  ];
  const feedGrid = $('#feed-grid');
  // The third-party player is created only after a visitor asks to watch.
  // Until then the reel costs no Instagram requests or video bytes.
  const reelFrame = $('#featured-reel');
  reelFrame?.querySelector('.reel-play')?.addEventListener('click', () => {
    const player = document.createElement('iframe');
    player.src = 'https://www.instagram.com/reel/DdGRyE9id0Q/embed/';
    player.title = 'Clock To Fit Instagram reel';
    player.allow = 'autoplay; encrypted-media; picture-in-picture; web-share';
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    reelFrame.replaceChildren(player);
  }, { once: true });
  if (feedGrid) {
    feedGrid.innerHTML = feedDefaults.map((tile, i) => {
      const post = SITE.feed[i] || {};
      const src = post.image || window.CTF_PHOTOS?.[tile.img] || `assets/photos/${tile.img}.webp`;
      const caption = post.caption || tile.cap;
      return `<a class="polaroid" style="--r:${tile.r}deg" href="${post.url || SITE.instagram}" target="_blank" rel="noopener noreferrer" aria-label="${SITE.handle} on Instagram: ${caption}"><img src="${src}" alt="" loading="lazy" style="object-position:${tile.pos}"><span class="polaroid-cap">${caption}</span><span class="polaroid-view" aria-hidden="true">View ↗</span></a>`;
    }).join('');
    feedGrid.addEventListener('pointermove', (e) => {
      const tile = e.target.closest('.polaroid'); if (!tile) return;
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - r.left}px`); tile.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
})();
