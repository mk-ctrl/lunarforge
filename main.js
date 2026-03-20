/* ══════════════════════════════════════════════
   LUNAR FORGE 1.0 — INTERACTIONS & ANIMATIONS
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── DOM REFS ────────────────────────────────
  const intro = document.getElementById('intro');
  const enterBtn = document.getElementById('enter-btn');
  const enterWrap = document.getElementById('intro-enter-wrap');
  const robotCanvas = document.getElementById('robot-canvas');
  const robotLoading = document.getElementById('robot-loading');
  const navbar = document.getElementById('navbar');
  const siteContent = document.getElementById('site-content');
  const menuToggle = document.getElementById('menu-toggle');
  const navAction1 = document.getElementById('nav-action-1');
  const navAction2 = document.getElementById('nav-action-2');
  const overlay = document.getElementById('contact-overlay');
  const closeBtn = document.getElementById('contact-close');
  const introVideo = document.getElementById('intro-video');
  const splineBg = document.getElementById('spline-bg');
  const splineBgCanvas = document.getElementById('spline-bg-canvas');
  const splineBgLoading = document.getElementById('spline-bg-loading');
  const splineMoon = document.getElementById('spline-moon');
  const splineMoonCanvas = document.getElementById('spline-moon-canvas');
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');

  // ══════════════════════════════════════════════
  // PARTICLE SYSTEM
  // ══════════════════════════════════════════════
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let animFrame;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = 2;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = 0;
      this.baseOpacity = this.opacity;
      // Some particles are rectangles, some are dots
      this.isRect = 0;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.01;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.rotation += this.rotSpeed;

      // Mouse proximity interaction
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 50) {
        this.opacity = 2;
        const force = (50 - dist) / 50 * 0.3;
        this.x += (dx / dist) * force;
        this.y += (dy / dist) * force;
      } else {
        this.opacity += (this.baseOpacity - this.opacity) * 0.05;
      }

      // Wrap around
      if (this.x < -10) this.x = canvas.width + 10;
      if (this.x > canvas.width + 10) this.x = -10;
      if (this.y < -10) this.y = canvas.height + 10;
      if (this.y > canvas.height + 10) this.y = -10;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = '#ffffff';
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      if (this.isRect) {
        ctx.fillRect(-this.size, -this.size * 0.4, this.size * 2, this.size * 0.8);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function initParticles() {
    resizeCanvas();
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 4000), 2000);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    animFrame = requestAnimationFrame(animateParticles);
  }

  // ══════════════════════════════════════════════
  // SPLINE ROBOT — Load on intro screen
  // ══════════════════════════════════════════════
  const ROBOT_SCENE = 'https://prod.spline.design/x4zhGT-Zgpo9FFOy/scene.splinecode';

  async function loadRobot() {
    try {
      const { Application } = await import('https://esm.sh/@splinetool/runtime');
      const spline = new Application(robotCanvas);
      await spline.load(ROBOT_SCENE);

      console.log('[Lunar Forge] Robot loaded!');

      // Optional: Camera manipulation can be added here if needed in the future
      // Removed random rotation so robot stays fixed in the middle default position

      // Hide loading spinner, show robot
      robotLoading.classList.add('hidden');
      robotCanvas.classList.add('loaded');

      // Show the ENTER button
      setTimeout(() => {
        enterWrap.classList.add('visible');
      }, 400);

    } catch (err) {
      console.warn('[Lunar Forge] Robot failed to load:', err);
      // Fallback: still show ENTER button
      robotLoading.classList.add('hidden');
      enterWrap.classList.add('visible');
    }
  }

  // Start loading robot after the text animation (1.2s)
  setTimeout(loadRobot, 1200);

  // ══════════════════════════════════════════════
  // ENTER → SITE TRANSITION
  // ══════════════════════════════════════════════
  enterBtn.addEventListener('click', () => {
    intro.classList.add('hidden');
    navbar.classList.add('visible');
    siteContent.classList.add('visible');

    // Pause & clean up background video after fade
    if (introVideo) {
      setTimeout(() => {
        introVideo.pause();
        introVideo.src = '';
        introVideo.load();
      }, 1000);
    }

    // Show & load full-page Spline 3D background + moon overlay
    loadSplineBg();
    loadSplineMoon();
  });

  // ══════════════════════════════════════════════
  // SESSION & NAVIGATION STATE
  // ══════════════════════════════════════════════
  function updateNavForSession() {
    if (!navAction1 || !navAction2) return;

    if (localStorage.getItem('lunarforge_session')) {
      // Logged in state: LOGOUT & DASHBOARD
      navAction1.innerHTML = `<a href="#" id="nav-logout" class="nav-cta" style="border-color:rgba(255,59,92,0.3);color:var(--error);background:transparent;">LOGOUT</a>`;
      navAction2.innerHTML = `<a href="dashboard.html" class="nav-cta" style="border-color:rgba(0,212,255,0.3);color:var(--accent-cyan);">DASHBOARD</a>`;

      const logoutBtn = document.getElementById('nav-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('lunarforge_session');
          updateNavForSession(); // Refresh nav instantly
        });
      }
    } else {
      // Logged out state: LOGIN & REGISTER
      navAction1.innerHTML = `<a href="login.html" class="nav-cta" style="border-color:rgba(255,255,255,0.2);color:var(--text);background:transparent;">LOGIN</a>`;
      navAction2.innerHTML = `<a href="register.html" class="nav-cta">REGISTER</a>`;
    }
  }

  // Initialize nav state immediately
  updateNavForSession();

  // ══════════════════════════════════════════════
  // FULL-PAGE SPLINE 3D BACKGROUND
  // ══════════════════════════════════════════════
  const SPLINE_BG_SCENE = 'https://prod.spline.design/cbLIR9756qJJPx9n/scene.splinecode';

  async function loadSplineBg() {
    try {
      const { Application } = await import('https://esm.sh/@splinetool/runtime');
      const app = new Application(splineBgCanvas);
      await app.load(SPLINE_BG_SCENE);

      console.log('[Lunar Forge] Spline background loaded!');

      // Fade in the background
      splineBg.classList.add('visible');

    } catch (err) {
      console.warn('[Lunar Forge] Spline background failed to load:', err);
      if (splineBgLoading) splineBgLoading.classList.add('hidden');
    }
  }

  // ══════════════════════════════════════════════
  // SPLINE MOON OVERLAY
  // ══════════════════════════════════════════════
  const SPLINE_MOON_SCENE = 'https://prod.spline.design/3irAsJEPtR-P-FQp/scene.splinecode';

  async function loadSplineMoon() {
    try {
      if (!splineMoonCanvas) return;
      const { Application } = await import('https://esm.sh/@splinetool/runtime');
      const app = new Application(splineMoonCanvas);
      await app.load(SPLINE_MOON_SCENE);

      console.log('[Lunar Forge] Spline moon overlay loaded!');
      // Wait 1.5 seconds for Spline to perform its initial sizing glitch
      // completely out of sight before triggering the CSS opacity fade-in
      setTimeout(() => {
        splineMoon.classList.add('visible');
      }, 300);

    } catch (err) {
      console.warn('[Lunar Forge] Spline moon overlay failed to load:', err);
    }
  }

  // ══════════════════════════════════════════════
  // COUNTDOWN TIMER — March 30, 2026, 7:00 PM IST
  // ══════════════════════════════════════════════
  // Target: March 30, 2026, 19:00 IST (UTC+5:30) = 13:30 UTC
  const TARGET_DATE = new Date(Date.UTC(2026, 2, 30, 13, 30, 0));

  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMins = document.getElementById('cd-mins');
  const cdSecs = document.getElementById('cd-secs');

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateCountdown() {
    const now = Date.now();
    const diff = TARGET_DATE.getTime() - now;

    if (diff <= 0) {
      cdDays.textContent = '00';
      cdHours.textContent = '00';
      cdMins.textContent = '00';
      cdSecs.textContent = '00';
      return;
    }

    const seconds = Math.floor(diff / 1000);
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    cdDays.textContent = pad(d);
    cdHours.textContent = pad(h);
    cdMins.textContent = pad(m);
    cdSecs.textContent = pad(s);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ══════════════════════════════════════════════
  // CONTACT OVERLAY
  // ══════════════════════════════════════════════
  menuToggle.addEventListener('click', () => {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // ══════════════════════════════════════════════
  // SCROLL REVEAL (IntersectionObserver)
  // ══════════════════════════════════════════════
  function setupReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0', 10);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
  }

  // ══════════════════════════════════════════════
  // 3D TILT ON TRACK CARDS (mouse parallax)
  // ══════════════════════════════════════════════
  function setupTilt() {
    const cards = document.querySelectorAll('[data-tilt]');

    cards.forEach(card => {
      const inner = card.querySelector('.track-card-inner');
      if (!inner) return;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        inner.style.transform = `
          perspective(800px)
          rotateY(${x * 12}deg)
          rotateX(${-y * 12}deg)
          translateZ(10px)
        `;
      });

      card.addEventListener('mouseleave', () => {
        inner.style.transform = '';
      });
    });
  }

  // Spline robot is now loaded on the intro screen above.
  // Hero #spline-container is still available for a background 3D scene.

  // ══════════════════════════════════════════════
  // MOUSE TRACKING
  // ══════════════════════════════════════════════
  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // ══════════════════════════════════════════════
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ══════════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ══════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Boot
  
  setupReveal();
  setupTilt();

})();
