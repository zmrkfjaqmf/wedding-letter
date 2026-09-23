/* =========================================================
   Wedding Invitation — jp/script.js
   Jaehyung ♡ Gyuwon (2026.12.12)
   Vanilla JS only.
   ========================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------
  // CONFIG & CONSTANTS
  // ---------------------------------------------------------
  const SHARE_TITLE      = 'ペ・ジェヒョン ♡ イ・ギュウォン 結婚式のご案内';
  const SHARE_DESC       = '2026年 12月 12日(土) 18時 40分\n嘉泉(ガチョン)コンベンション 5階';
  const SHARE_IMAGE      = 'https://jaehyung-gyuwon.kro.kr/images/2_DSC03501.jpg';
  const SHARE_URL        = 'https://jaehyung-gyuwon.kro.kr/jp';
  const TARGET_DATE_STR  = '2026-12-12';

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced     = () => reducedMotion.matches;
  const $  = (sel, root = document) => root.querySelector(sel);   const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const haptic = (n) => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };

  // ---------------------------------------------------------
  // 1. HERO entrance step-in
  // ---------------------------------------------------------
  function setupHero() {
    const hero = $('.hero');     if (!hero) return;     requestAnimationFrame(() => {       requestAnimationFrame(() => hero.classList.add('is-loaded'));     });   }    // ---------------------------------------------------------   // 2. IntersectionObserver fade reveal   // ---------------------------------------------------------   function setupReveal() {     const targets = $$('.reveal');
    if (!targets.length) return;
    if (isReduced()) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => io.observe(el));

    const firstSlide = $('.gallery-slide:first-child');
    if (firstSlide) firstSlide.classList.add('first-reveal');
  }

  // ---------------------------------------------------------
  // 3. Petals background canvas
  // ---------------------------------------------------------
  function setupPetals() {
    if (isReduced()) return;
    const canvas = $('.bg-petals');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    let petals = [];
    let count = 24;
    let running = true;
    let frameCount = 0;
    let measureStart = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    class Petal {
      constructor(init) { this.reset(init); }
      reset(init) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : -30;
        this.size = 8 + Math.random() * 8;
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.03;
        this.dur = 14000 + Math.random() * 8000;
        this.start = performance.now() - (init ? Math.random() * this.dur : 0);
        this.swayAmp = 20 + Math.random() * 20;
        this.swayPhase = Math.random() * Math.PI * 2;
        this.opacity = 0.18 + Math.random() * 0.14;
        this.color = Math.random() < 0.7 ? '#C9A2A2' : '#A8B59C';
        this.baseX = this.x;
      }
      step(now) {
        const t = (now - this.start) / this.dur;
        if (t > 1) { this.reset(false); return; }
        this.y = -30 + (H + 60) * t;
        this.x = this.baseX + Math.sin(now / 1000 + this.swayPhase) * this.swayAmp;
        this.rot += this.rotSpeed;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.4, this.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function spawn() {
      petals = Array.from({ length: count }, () => new Petal(true));
    }

    function loop(now) {
      if (running) {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < petals.length; i++) {
          petals[i].step(now);
          petals[i].draw();
        }
        frameCount++;
        if (!measureStart) measureStart = now;
        if (now - measureStart > 5000 && frameCount > 0) {
          const fps = (frameCount / (now - measureStart)) * 1000;
          if (fps < 50 && count > 12) {
            count = 12;
            spawn();
          }
          measureStart = 0;
          frameCount = 0;
        }
      }
      requestAnimationFrame(loop);
    }

    resize();
    spawn();
    requestAnimationFrame(loop);
    window.addEventListener('resize', resize, { passive: true });

    document.addEventListener('visibilitychange', () => {
      running = document.visibilityState !== 'hidden';
    });
  }

  // ---------------------------------------------------------
  // 4. Calendar render + D-day count-up
  // ---------------------------------------------------------
  function setupCalendar() {
    const tbl = $('.cal');
    if (!tbl) return;
    const target = new Date(TARGET_DATE_STR + 'T00:00:00');
    const y = target.getFullYear();
    const m = target.getMonth();
    const first = new Date(y, m, 1).getDay();
    const last  = new Date(y, m + 1, 0).getDate();
    const tbody = tbl.querySelector('tbody');

    let html = '<tr>';
    for (let i = 0; i < first; i++) html += '<td></td>';
    for (let d = 1; d <= last; d++) {
      const dow = (first + d - 1) % 7;
      const cls = [];
      if (d === target.getDate()) cls.push('today');
      if (dow === 0) cls.push('sun');
      if (dow === 6) cls.push('sat');
      html += `<td${cls.length ? ` class="${cls.join(' ')}"` : ''}><span>${d}</span></td>`;
      if ((first + d) % 7 === 0 && d !== last) html += '</tr><tr>';
    }
    html += '</tr>';
    tbody.innerHTML = html;

    const ddayNum = $('#dday-num');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDay = new Date(y, m, target.getDate(), 0, 0, 0);
    const diff = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));
    const ddayLabel = $('.dday-label');
    const ddayBlock = $('.dday');

    if (diff > 0) {
      ddayNum.dataset.target = String(diff);
      ddayNum.textContent = isReduced() ? String(diff) : '0';
    } else if (diff === 0) {
      ddayBlock.innerHTML = '<span class="script" style="font-size:24px;color:var(--color-primary)">Today</span><br><span style="font-size:14px;color:var(--color-muted)">本日、結婚式を執り行います</span>';
      if (ddayLabel) ddayLabel.style.display = 'none';
    } else {
      ddayNum.dataset.target = String(-diff);
      ddayNum.textContent = isReduced() ? String(-diff) : '0';
      if (ddayLabel) ddayLabel.textContent = `共に歩んだ日々 +`;
      ddayBlock.firstChild.textContent = 'D + ';
    }

    if (!isReduced() && diff !== 0) {
      const onIntersect = (entries, obs) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          countUp(ddayNum, parseInt(ddayNum.dataset.target, 10), 1400);
          obs.disconnect();
        });
      };
      new IntersectionObserver(onIntersect, { threshold: 0.4 }).observe($('#calendar'));
    }
  }

  function countUp(el, target, dur) {
    const start = performance.now();
    function tick(now) {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // 5. Gallery
  // ---------------------------------------------------------
  let galleryAPI = null;
  function setupGallery() {
    const stage = $('.gallery-stage');
    const track = $('#gallery-track');
    if (!stage || !track) return;
    const slides = $$('.gallery-slide', track);     const dots   = $$('#gallery-dots li');
    const prev   = $('.gallery-prev');
    const next   = $('.gallery-next');
    const N = slides.length;
    let idx = 0;
    let auto = null;
    let dragX = 0;
    let dragStartX = 0;
    let dragging = false;
    let inViewport = false;
    let userPaused = false;

    function show(i, withTransition = true) {
      idx = ((i % N) + N) % N;
      track.style.transition = withTransition ? '' : 'none';
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle('active', k === idx));
      slides.forEach((s, k) => {
        s.setAttribute('aria-hidden', k === idx ? 'false' : 'true');
      });
    }
    function startAuto() {
      if (isReduced() || userPaused || !inViewport) return;
      stopAuto();
      auto = setInterval(() => show(idx + 1), 5000);
    }
    function stopAuto() {
      if (auto) { clearInterval(auto); auto = null; }
    }
    function pauseUser(durationMs = 10000) {
      userPaused = true;
      stopAuto();
      clearTimeout(pauseUser._t);
      pauseUser._t = setTimeout(() => { userPaused = false; startAuto(); }, durationMs);
    }

    track.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      dragging = true;
      dragStartX = e.touches[0].clientX;
      dragX = 0;
      track.style.transition = 'none';
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      dragX = e.touches[0].clientX - dragStartX;
      track.style.transform = `translateX(calc(-${idx * 100}% + ${dragX}px))`;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      const threshold = 50;
      if (dragX > threshold) { show(idx - 1); haptic(8); }
      else if (dragX < -threshold) { show(idx + 1); haptic(8); }
      else { show(idx); }
      pauseUser(10000);
    });

    prev?.addEventListener('click', () => { show(idx - 1); haptic(8); pauseUser(10000); });
    next?.addEventListener('click', () => { show(idx + 1); haptic(8); pauseUser(10000); });

    slides.forEach((slide, i) => {
      const img = $('img', slide);
      img?.addEventListener('click', () => {
        if (Math.abs(dragX) > 5) return;
        openLightbox(i);
      });
    });

    stage.tabIndex = 0;
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { show(idx - 1); haptic(8); pauseUser(10000); }
      if (e.key === 'ArrowRight') { show(idx + 1); haptic(8); pauseUser(10000); }
    });

    new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      if (inViewport) startAuto(); else stopAuto();
    }, { threshold: 0.4 }).observe(stage);

    show(0);
    galleryAPI = { show, count: N };
  }

  // ---------------------------------------------------------
  // 6. Lightbox
  // ---------------------------------------------------------
  let lightboxAPI = null;
  function setupLightbox() {
    const lb = $('#lightbox');
    const img = $('#lightbox-img');
    const close = $('#lightbox-close');
    if (!lb || !img || !close) return;
    const slides = $$('.gallery-slide img');
    let scale = 1;
    let originX = 0, originY = 0;
    let lastDist = 0;
    let lastTap = 0;
    let panStart = null;
    let prevFocus = null;
    let currentIdx = 0;

    function setTransform() {
      img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    }
    function reset() {
      scale = 1; originX = 0; originY = 0;
      img.style.transform = '';
    }

    function open(i) {
      currentIdx = i;
      img.src = slides[i].src;
      img.alt = slides[i].alt || '';
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      prevFocus = document.activeElement;
      close.focus();
      haptic(15);
    }
    function closeFn() {
      lb.classList.remove('is-open');
      setTimeout(() => {
        lb.hidden = true;
        reset();
        document.body.style.overflow = '';
        if (prevFocus && prevFocus.focus) prevFocus.focus();
      }, isReduced() ? 0 : 220);
    }

    close.addEventListener('click', closeFn);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeFn(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeFn();
      if (e.key === 'ArrowLeft' && galleryAPI) {
        currentIdx = (currentIdx - 1 + galleryAPI.count) % galleryAPI.count;
        img.src = slides[currentIdx].src; reset();
        galleryAPI.show(currentIdx);
      }
      if (e.key === 'ArrowRight' && galleryAPI) {
        currentIdx = (currentIdx + 1) % galleryAPI.count;
        img.src = slides[currentIdx].src; reset();
        galleryAPI.show(currentIdx);
      }
    });

    img.addEventListener('touchstart', (e) => {
      lb.classList.add('is-zooming');
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        lastDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) {
          scale = scale > 1.05 ? 1 : 2.4;
          originX = 0; originY = 0;
          lb.classList.remove('is-zooming');
          setTransform();
          haptic(10);
        } else {
          if (scale > 1) {
            panStart = { x: e.touches[0].clientX - originX, y: e.touches[0].clientY - originY };
          }
        }
        lastTap = now;
      }
    }, { passive: true });

    img.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        if (lastDist > 0) {
          scale = clamp(scale * (d / lastDist), 1, 3);
          setTransform();
        }
        lastDist = d;
      } else if (e.touches.length === 1 && panStart && scale > 1) {
        originX = e.touches[0].clientX - panStart.x;
        originY = e.touches[0].clientY - panStart.y;
        setTransform();
      }
    }, { passive: true });

    img.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        lastDist = 0;
        panStart = null;
        if (scale < 1.05) reset();
        lb.classList.remove('is-zooming');
      }
    });

    lightboxAPI = { open };
    window.openLightbox = open;
  }

  function openLightbox(i) {
    if (lightboxAPI) lightboxAPI.open(i);
  }

  // ---------------------------------------------------------
  // 7. Copy account number + toast
  // ---------------------------------------------------------
  function setupCopy() {
    $$('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const txt = btn.dataset.copy || '';
        let ok = false;
        try {
          await navigator.clipboard.writeText(txt);
          ok = true;
        } catch (e) {
          try {
            const ta = document.createElement('textarea');
            ta.value = txt;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            ok = document.execCommand('copy');
            document.body.removeChild(ta);
          } catch (e2) { ok = false; }
        }
        if (ok) {
          btn.classList.add('is-copied');
          haptic(15);
          showToast('口座番号がコピーされました');
          setTimeout(() => btn.classList.remove('is-copied'), 1400);
        } else {
          showToast('コピーに失敗しました。手動で選択してください');
        }
      });
    });
  }

  // ---------------------------------------------------------
  // 8. Toast
  // ---------------------------------------------------------
  let toastTimer = null;
  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove('is-visible');
      setTimeout(() => { t.hidden = true; }, 320);
    }, 1700);
  }

  // ---------------------------------------------------------
  // 9. Music toggle
  // ---------------------------------------------------------
  function setupMusic() {
    const btn = $('#music-toggle');
    const audio = $('#bgm');
    if (!btn || !audio) return;
    audio.volume = 0;

    function fadeVolume(target, dur) {
      const start = audio.volume;
      const t0 = performance.now();
      function tick(now) {
        const t = clamp((now - t0) / dur, 0, 1);
        audio.volume = start + (target - start) * t;
        if (t < 1) requestAnimationFrame(tick);
        else if (target === 0) audio.pause();
      }
      requestAnimationFrame(tick);
    }

    btn.addEventListener('click', async () => {
      btn.classList.remove('is-rippling');
      void btn.offsetWidth;
      btn.classList.add('is-rippling');
      haptic(10);
      try {
        if (audio.paused) {
          await audio.play();
          btn.setAttribute('aria-pressed', 'true');
          fadeVolume(0.4, 1500);
        } else {
          fadeVolume(0, 600);
          btn.setAttribute('aria-pressed', 'false');
        }
      } catch (e) {
        showToast('BGMファイルを読み込めませんでした。(audio/bgm.mp3)');
      }
    });
  }

  // ---------------------------------------------------------
  // 10. Share
  // ---------------------------------------------------------
  function setupShare() {
    const btnLink  = $('#share-link');
    const btnShare = $('#share-share');

    btnLink?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(SHARE_URL);
        haptic(15);
        showToast('招待状のリンクがコピーされました');
      } catch (e) {
        showToast('コピーに失敗しました');
      }
    });

    btnShare?.addEventListener('click', async () => {
      haptic(15);
      if (navigator.share) {
          try {
            await navigator.share({
              title: SHARE_TITLE,
              text: SHARE_DESC,
              url: SHARE_URL,
            });
          } catch (e) {
            // 사용자가 취소한 경우 예외 처리
          }
        } else {
          // 지원하지 않는 브라우저는 링크 복사로 대체
          try {
            await navigator.clipboard.writeText(SHARE_URL);
            haptic(15);
            showToast('招待状のリンクがコピーされました');
          } catch (e) {
            showToast('コピーに失敗しました');
          }
        }
    });
  }

  // ---------------------------------------------------------
  // 11. Kakao Map
  // ---------------------------------------------------------
  function setupMap() {
    const container = document.getElementById('map');
    if (!container) return;

    if (window.kakao && window.kakao.maps) {
      const options = {
        center: new kakao.maps.LatLng(37.4485, 127.1272),
        level: 3
      };

      const map = new kakao.maps.Map(container, options);

      const markerPosition = new kakao.maps.LatLng(37.4485, 127.1272);
      const marker = new kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map);
    }
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------
  function init() {
    setupHero();
    setupReveal();
    setupPetals();
    setupCalendar();
    setupGallery();
    setupLightbox();
    setupCopy();
    setupMusic();
    setupShare();
    setupMap();

    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', () => location.reload());
    } else if (reducedMotion.addListener) {
      reducedMotion.addListener(() => location.reload());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
