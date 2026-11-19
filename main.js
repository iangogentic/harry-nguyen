(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const G = window.gsap, hasG = !!(G && window.ScrollTrigger);
  root.classList.add('js');
  if (!hasG) root.classList.add('no-gsap');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================= sound (opt-in, synthesised) ================= */
  let ac = null, sndOn = false;
  const snd = {
    tick(f = 1800, d = .035, g = .05) {
      if (!sndOn || !ac) return;
      const o = ac.createOscillator(), a = ac.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      a.gain.setValueAtTime(g, ac.currentTime); a.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d);
      o.connect(a).connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
    },
    whoosh(d = .35, from = 600, to = 3200, g = .12) {
      if (!sndOn || !ac) return;
      const n = ac.sampleRate * d, buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), a = ac.createGain();
      s.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(from, ac.currentTime); f.frequency.exponentialRampToValueAtTime(to, ac.currentTime + d);
      a.gain.value = g; s.connect(f).connect(a).connect(ac.destination); s.start();
    }
  };
  const sndBtn = $('#snd');
  sndBtn.addEventListener('click', () => {
    sndOn = !sndOn;
    if (sndOn && !ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { sndOn = false; } }
    if (ac && ac.state === 'suspended') ac.resume();
    sndBtn.setAttribute('aria-pressed', sndOn); sndBtn.textContent = sndOn ? 'Sound on' : 'Sound off';
    snd.tick(1200, .08, .08);
  });

  /* ================= the card: spring physics, foil, flip ================= */
  const card = $('#card'), rot = $('.tcg__rot', card), wrap = $('#cardWrap');
  const st = { tx: .5, ty: .5, x: .5, y: .5, vx: 0, vy: 0, flip: 0, live: false, visible: true, t0: performance.now() };
  function frame(t) {
    if (st.visible) {
      if (!st.live && !reduce) { const k = (t - st.t0) / 1000; st.tx = .5 + Math.cos(k * .8) * .3; st.ty = .5 + Math.sin(k * 1.15) * .24; }
      st.vx = (st.vx + (st.tx - st.x) * .09) * .8; st.vy = (st.vy + (st.ty - st.y) * .09) * .8;
      st.x += st.vx; st.y += st.vy;
      const rx = (st.y - .5) * -24, ry = (st.x - .5) * 30;
      rot.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${(ry + st.flip).toFixed(2)}deg)`;
      const s = card.style;
      s.setProperty('--mx', (st.x * 100).toFixed(1) + '%'); s.setProperty('--my', (st.y * 100).toFixed(1) + '%');
      s.setProperty('--bx', (37 + st.x * 26).toFixed(1) + '%'); s.setProperty('--by', (33 + st.y * 34).toFixed(1) + '%');
      s.setProperty('--hyp', clamp(Math.hypot(st.x - .5, st.y - .5) * 2, 0, 1).toFixed(3));
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if ('IntersectionObserver' in window) new IntersectionObserver(e => { st.visible = e[0].isIntersecting; }).observe(wrap);
  wrap.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = card.getBoundingClientRect();
    st.live = true; st.tx = clamp((e.clientX - r.left) / r.width, -.2, 1.2); st.ty = clamp((e.clientY - r.top) / r.height, -.2, 1.2);
  });
  wrap.addEventListener('pointerleave', () => { st.live = false; st.t0 = performance.now() - 1900; });
  // gyroscope on phones
  let gyro = false;
  const onTilt = e => {
    if (e.gamma == null) return;
    st.live = true; st.tx = clamp(.5 + e.gamma / 50, 0, 1); st.ty = clamp(.5 + (e.beta - 45) / 60, 0, 1);
  };
  const startGyro = () => {
    if (gyro || fine) return; gyro = true;
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') D.requestPermission().then(p => { if (p === 'granted') addEventListener('deviceorientation', onTilt); }).catch(() => {});
    else if (D) addEventListener('deviceorientation', onTilt);
  };
  if (!fine && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') startGyro();
  let flipped = false;
  const flip = () => {
    startGyro(); flipped = !flipped; snd.whoosh(.3, 500, 2600, .1);
    card.style.setProperty('--o', flipped ? 0 : 1);
    if (hasG && !reduce) G.to(st, { flip: flipped ? 180 : 0, duration: 1, ease: 'back.out(1.3)' }); else st.flip = flipped ? 180 : 0;
  };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });

  /* ================= project sheets ================= */
  const P = {
    tillrise: {
      art: 'tillrise', no: '01', status: 'Live', title: 'Tillrise × Allure Nails', tag: 'Booking software for independent salons, proven in my own family\'s shop first.',
      body: [
        ['The problem', 'I co-own a nail salon with my mom in Garland, Texas. Booking lived in phone calls, walk-ins and an old point-of-sale system. Empty chairs on slow days, no-shows on busy ones.'],
        ['What we shipped', 'Online booking with a paid deposit, so a booking is a commitment. It runs live at Allure, and real customers have booked and paid deposits through it.'],
        ['My part', 'Co-founder for sales and growth. I decide what is worth building from the owner\'s chair, onboard the staff, and I am the one who lives with it on a Saturday.'],
        ['What I\'m learning', 'Owners don\'t buy features. They buy fewer empty chairs and fewer no-shows, explained in one sentence by someone who has had both.']
      ],
      links: [['tillrise.com ↗', 'https://tillrise.com/'], ['Founder page ↗', 'https://tillrise.com/company']]
    },
    gogogiri: {
      art: 'line', no: '02', status: '2021 – 2024', title: 'GoGogiri', tag: 'Onigiri and Korean corn dogs, from a rented kitchen slot to three stores.',
      body: [
        ['The run', 'Co-founded in college in Lubbock, Texas. Food trucks first, then storefronts in Lubbock, Abilene and Dallas. Five locations opened, three running at once, 30+ people, about $175K in our best month.'],
        ['My part', 'I led content and ran paid media on Meta, Google and TikTok. The weekly flavor drop was the engine: new product, new video, new line at the window.'],
        ['The numbers', 'Top Instagram reels at 4.7M and 2.2M plays. 5.2M views across three TikTok accounts. Coverage in the Dallas Observer, CultureMap, FOX 4 and Resy.'],
        ['The lesson', 'Attention was never the problem. Restaurant margins were. I now look at unit economics before anything else, which is the habit I\'d bring to your funnel.']
      ],
      links: [['Dallas Observer ↗', 'https://www.dallasobserver.com/food-drink/dallas-onigiri-and-corn-dog-restaurant-gogogiri-17803727/'], ['Podcast interview ↗', 'https://www.youtube.com/watch?v=FZsb9icsyI8&t=54s'], ['Instagram ↗', 'https://www.instagram.com/gogogiridallas/']]
    },
    engine: {
      art: 'engine', no: 'LAB', status: 'Prototype', title: 'GTM Engine', tag: 'Running my own job search as an outbound motion.',
      body: [
        ['The idea', 'The honest way to show go-to-market work is to do it. So my job search is the first campaign.'],
        ['What it does', 'Finds startups that sell to restaurants, salons and local businesses, researches each one, works out who to talk to, and drafts a first message that opens with something I actually know about their customer.'],
        ['How I\'ll measure it', 'Every company, contact and message gets logged. Reply rate and conversations booked, reported here once there are real numbers.'],
        ['Status', 'In build. Nothing to show yet, and I\'d rather say that than fake a screenshot.']
      ],
      links: []
    },
    radar: {
      art: 'radar', no: 'LAB', status: 'Prototype', title: 'Drop Radar', tag: 'Restock and price alerts for limited trading-card releases.',
      body: [
        ['The itch', 'I collect trading cards. Limited releases sell out in minutes and restock information is scattered across a dozen retailer sites.'],
        ['What it does', 'Watches retailer pages for restocks and new listings, compares the price to market value, and pings me when something is worth buying.'],
        ['Why it\'s here', 'Swap cards for inventory and it is a sourcing tool: watch suppliers, flag price and stock changes, tell a buyer when to act.'],
        ['Status', 'In build. I\'ll post what it caught and what it missed after the first real release.']
      ],
      links: []
    }
  };
  const sheet = $('#sheet'), sheetIn = $('#sheetIn');
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  $$('[data-project]').forEach(b => b.addEventListener('click', () => {
    const p = P[b.dataset.project]; if (!p) return;
    $('#sheetArt').style.backgroundImage = `url(assets/${p.art}.webp)`;
    sheetIn.innerHTML =
      `<div class="sheet__top"><span>${esc(p.no)}</span><span>${esc(p.status)}</span></div>` +
      `<h3>${esc(p.title)}</h3><p class="sheet__tag">${esc(p.tag)}</p>` +
      `<div class="sheet__grid">${p.body.map(([h, t]) => `<div><h4>${esc(h)}</h4><p>${esc(t)}</p></div>`).join('')}</div>` +
      (p.links.length ? `<div class="sheet__links">${p.links.map(([l, u]) => `<a class="btn btn--ink" target="_blank" rel="noopener" href="${u}">${esc(l)}</a>`).join('')}</div>` : '');
    snd.whoosh(.28, 300, 1800, .08);
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', '');
    if (lenis) lenis.stop();
  }));
  const closeSheet = () => { if (sheet.close) sheet.close(); else sheet.removeAttribute('open'); };
  $('#sheetX').addEventListener('click', closeSheet);
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
  sheet.addEventListener('close', () => { if (lenis) lenis.start(); });

  /* ================= small things ================= */
  const draft = $('#draftBtn');
  draft.addEventListener('click', () => { draft.textContent = 'Draft notes ' + (root.classList.toggle('draft') ? 'on' : 'off'); });
  $('#printBtn').addEventListener('click', () => print());
  $$('a[href="#"], a[href="mailto:"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  $('#yr').textContent = new Date().getFullYear();

  // slab tilt
  if (fine && !reduce) $$('.slab').forEach(s => {
    s.addEventListener('pointermove', e => {
      const r = s.getBoundingClientRect();
      s.style.setProperty('--tx', (((e.clientX - r.left) / r.width - .5) * 9).toFixed(2) + 'deg');
      s.style.setProperty('--ty', (((e.clientY - r.top) / r.height - .5) * -7).toFixed(2) + 'deg');
    });
    s.addEventListener('pointerleave', () => { s.style.setProperty('--tx', '0deg'); s.style.setProperty('--ty', '0deg'); });
  });

  // counters
  function count(el, dur = 1.4) {
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (!hasG || reduce) return;
    const o = { v: 0 };
    G.to(o, { v: to, duration: dur, ease: 'power3.out', onUpdate: () => { el.textContent = pre + o.v.toFixed(dec) + suf; } });
  }

  let lenis = null;
  if (!hasG) return; // everything below is enhancement

  /* ================= motion system ================= */
  G.registerPlugin(ScrollTrigger);
  if (window.SplitText) G.registerPlugin(SplitText);
  if (window.CustomEase) { G.registerPlugin(CustomEase); CustomEase.create('brand', '0.16,1,0.3,1'); }
  const EASE = window.CustomEase ? 'brand' : 'expo.out';
  G.defaults({ ease: EASE, duration: 1 });

  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .11, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }

  // cursor
  if (fine && !reduce) {
    root.classList.add('has-cursor');
    const c = $('#cursor'), lab = $('span', c);
    const qx = G.quickTo(c, 'x', { duration: .35, ease: 'power3' }), qy = G.quickTo(c, 'y', { duration: .35, ease: 'power3' });
    addEventListener('pointermove', e => { qx(e.clientX); qy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]'), l = !t && e.target.closest('a,button');
      c.classList.toggle('is-label', !!t); c.classList.toggle('is-link', !!l);
      lab.textContent = t ? t.dataset.cursor : '';
    });
    // magnetic buttons
    $$('[data-magnetic]').forEach(b => {
      const mx = G.quickTo(b, 'x', { duration: .5, ease: 'power3' }), my = G.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .28); my((e.clientY - r.top - r.height / 2) * .4); });
      b.addEventListener('pointerleave', () => { mx(0); my(0); });
      b.addEventListener('pointerenter', () => snd.tick());
    });
    $$('[data-cursor]').forEach(el => el.addEventListener('pointerenter', () => snd.tick(1400, .03, .04)));
  }

  // nav hides on the way down, returns on the way up
  const nav = $('#nav');
  ScrollTrigger.create({ start: 80, end: 'max', onUpdate: s => nav.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > 400) });

  /* ---------- hero intro ---------- */
  function heroIntro() {
    const tl = G.timeline();
    if (reduce) return tl;
    tl.from('.hero__name .ln>span', { yPercent: 112, duration: 1.2, stagger: .1 })
      .from('.hero__art img', { scale: 1.22, duration: 2.6, ease: 'power3.out', onStart: () => snd.whoosh(.5, 300, 2400, .1) }, 0)
      .from('.kicker, .hero__pitch, .hero__sub, .hero__cta>*', { y: 26, opacity: 0, duration: 1, stagger: .07 }, .35)
      .from('.hero__stats>div', { y: 34, opacity: 0, duration: .9, stagger: .07, onStart: () => $$('.hero__stats [data-count]').forEach(e => count(e)) }, .7)
      .fromTo('#nav', { opacity: 0 }, { opacity: 1, duration: .8 }, .5);
    return tl;
  }

  /* ---------- loader: the pack opens itself ---------- */
  const loader = $('#loader');
  const skipLoader = reduce || location.hash.length > 1 || /[?&]nopack/.test(location.search);
  if (skipLoader) { loader.remove(); heroIntro(); }
  else {
    root.classList.add('loading');
    if (lenis) lenis.stop();
    const o = { v: 0 }, cEl = $('#count');
    const tl = G.timeline({ onComplete: () => { loader.remove(); root.classList.remove('loading'); if (lenis) lenis.start(); ScrollTrigger.refresh(); } });
    tl.from('#pack', { y: 80, opacity: 0, rotation: -8, duration: .9 })
      .to(o, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { cEl.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
      .to('#pack', { rotation: 2.5, x: 5, duration: .05, repeat: 9, yoyo: true, ease: 'none' }, 1.15)
      .to('.pack__strip', { xPercent: 140, yPercent: -320, rotation: 32, opacity: 0, duration: .55, ease: 'power3.in', onStart: () => snd.whoosh(.4, 2000, 6000, .14) }, 1.65)
      .to('.pack__body', { yPercent: 150, rotation: 9, duration: .65, ease: 'power3.in' }, 1.85)
      .to('.loader__count, .loader__meta, .loader__skip', { opacity: 0, duration: .3 }, 1.9)
      .to(loader, { yPercent: -100, duration: 1, ease: EASE }, 2.15)
      .add(heroIntro(), 2.25);
    const hurry = () => tl.timeScale(5);
    $('#skip').addEventListener('click', hurry);
    addEventListener('keydown', e => { if (e.key === 'Escape') hurry(); }, { once: true });
  }

  /* ---------- masked line reveals ---------- */
  const ready = (document.fonts && document.fonts.ready) || Promise.resolve();
  ready.then(() => {
    if (!reduce && window.SplitText) $$('.split').forEach(el => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: self => G.from(self.lines, { yPercent: 108, duration: 1.15, stagger: .09, scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
      });
    });
    ScrollTrigger.refresh();
  });
  if (!reduce) {
    G.from('.contact__big .ln>span', { yPercent: 112, duration: 1.3, stagger: .1, scrollTrigger: { trigger: '.contact__big', start: 'top 85%', once: true } });
    // batches: slabs, stages, cards
    const batch = (sel, vars) => ScrollTrigger.batch(sel, { start: 'top 90%', once: true, onEnter: els => G.from(els, { y: 60, opacity: 0, duration: 1.1, stagger: .09, ...vars }) });
    batch('.slab', { rotation: 2 });
    batch('.wcard'); batch('.sealed'); batch('.why li', { y: 40 }); batch('.head__note, .head .btn, .receipts__foot, .eyebrow:not(.dpanel .eyebrow)', { y: 20 });
    G.from('.cv', { y: 80, opacity: 0, rotation: 1.5, duration: 1.2, scrollTrigger: { trigger: '.cv', start: 'top 92%', once: true } });
    G.from('.cv__seal', { scale: 2.4, opacity: 0, rotation: 20, duration: .5, ease: 'power4.in', scrollTrigger: { trigger: '.cv__seal', start: 'top 95%', once: true }, onComplete: () => snd.tick(180, .12, .2) });
    G.to('.hero__art', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.from('#card', { y: 160, rotation: -14, scale: .8, opacity: 0, duration: 1.5, scrollTrigger: { trigger: '.pull', start: 'top 70%', once: true }, onStart: () => snd.whoosh(.5, 300, 2400, .1) });
    $$('.stage').forEach(s => {
      G.from($('.stage__art', s), { scale: .9, y: 60, opacity: 0, duration: 1.4, scrollTrigger: { trigger: s, start: 'top 85%', once: true } });
      G.from($$('.stage__txt>*', s), { y: 44, opacity: 0, duration: 1, stagger: .08, scrollTrigger: { trigger: s, start: 'top 75%', once: true } });
      G.fromTo($('.stage__art img', s), { yPercent: -13 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- press marquee with scroll velocity ---------- */
  const track = $('.press__track');
  if (track && !reduce) {
    track.innerHTML += track.innerHTML;
    const loop = G.to(track, { xPercent: -50, duration: 36, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      onUpdate: s => {
        const v = clamp(Math.abs(s.getVelocity()) / 1200, 0, 5);
        G.to(loop, { timeScale: (1 + v) * (s.direction === -1 ? -1 : 1), duration: .2, overwrite: true });
        G.to(loop, { timeScale: 1, duration: 1.2, delay: .25 });
      }
    });
    track.addEventListener('pointerenter', () => G.to(loop, { timeScale: .15, duration: .4, overwrite: true }));
    track.addEventListener('pointerleave', () => G.to(loop, { timeScale: 1, duration: .6, overwrite: true }));
  }

  /* ---------- the drop: pinned horizontal scene ---------- */
  const mm = G.matchMedia();
  mm.add('(min-width: 1001px) and (prefers-reduced-motion: no-preference)', () => {
    const drop = $('#drop'), tr = $('#dropTrack'), bar = $('#dropBar');
    drop.classList.add('is-pinned');
    const dist = () => Math.max(0, tr.scrollWidth - innerWidth);
    const tw = G.to(tr, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.drop__pin', pin: true, scrub: .7, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true, onUpdate: s => G.set(bar, { scaleX: s.progress }) }
    });
    $$('.dpanel--step').forEach(p => {
      G.from($$('.num, h3, p', p), { y: 70, opacity: 0, duration: 1, stagger: .08, scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 82%', once: true } });
      const tag = $('.dcard', p);
      if (tag) G.from(tag, { rotation: 14, y: 140, opacity: 0, duration: 1.3, ease: 'back.out(1.4)', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 88%', once: true }, onStart: () => snd.tick(900, .06, .06) });
    });
    G.from('.dpanel--result li', { y: 60, opacity: 0, duration: 1, stagger: .08, scrollTrigger: { trigger: '.dpanel--result', containerAnimation: tw, start: 'left 75%', once: true } });
    return () => { drop.classList.remove('is-pinned'); G.set(tr, { clearProps: 'transform' }); };
  });

  /* ---------- embers ---------- */
  const cv = $('#embers');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let W, H, on = true; const ps = [];
    const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.5); W = cv.width = r.width * d; H = cv.height = r.height * d; };
    size(); addEventListener('resize', size);
    const spr = document.createElement('canvas'); spr.width = spr.height = 64;
    { const c = spr.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,214,140,1)'); g.addColorStop(.3, 'rgba(255,140,50,.55)'); g.addColorStop(1, 'rgba(255,80,20,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
    const mk = init => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: (.6 + Math.random() * 2.2) * (W / 1400 + .4), vy: .25 + Math.random() * .9, vx: -.5 + Math.random() * .3, a: .25 + Math.random() * .75, p: Math.random() * 6.28, hue: 18 + Math.random() * 26 });
    for (let i = 0; i < (fine ? 70 : 34); i++) ps.push(mk(true));
    new IntersectionObserver(e => { on = e[0].isIntersecting; }).observe(cv);
    const draw = t => {
      if (on) {
        ctx.clearRect(0, 0, W, H);
        for (const p of ps) {
          p.y -= p.vy; p.x += p.vx + Math.sin(t / 900 + p.p) * .35;
          if (p.y < -10 || p.x < -10) Object.assign(p, mk(false));
          const fl = .55 + .45 * Math.sin(t / 260 + p.p), d = p.r * 8;
          ctx.globalAlpha = p.a * fl; ctx.drawImage(spr, p.x - d / 2, p.y - d / 2, d, d);
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
