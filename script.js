// ─── NAVIGATION: scroll state ──────────────────────────────
const navWrapper = document.querySelector('.nav-wrapper');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navWrapper.classList.add('scrolled');
  } else {
    navWrapper.classList.remove('scrolled');
  }
}, { passive: true });

// ─── NAVIGATION: mobile hamburger ─────────────────────────
const hamburger = document.querySelector('.nav-hamburger');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navWrapper.classList.toggle('mobile-open');
  });

  // Close mobile nav when a link is clicked
  document.querySelectorAll('.nav-links a, .nav-cta').forEach(link => {
    link.addEventListener('click', () => {
      navWrapper.classList.remove('mobile-open');
    });
  });
}

// ─── SCROLL ANIMATIONS ────────────────────────────────────
const fadeEls = document.querySelectorAll(
  '.section-header, .about-grid, .feature-card, .plan-card, .testimonial-card, .cta-banner-content, .stat'
);

fadeEls.forEach(el => el.classList.add('fade-up'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger children if they're siblings
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

// Add staggered delays to grid items
document.querySelectorAll('.features-grid .feature-card').forEach((el, i) => {
  el.dataset.delay = i * 80;
});

document.querySelectorAll('.plans-grid .plan-card').forEach((el, i) => {
  el.dataset.delay = i * 100;
});

document.querySelectorAll('.testimonials-grid .testimonial-card').forEach((el, i) => {
  el.dataset.delay = i * 100;
});

document.querySelectorAll('.stats-grid .stat').forEach((el, i) => {
  el.dataset.delay = i * 60;
});

fadeEls.forEach(el => observer.observe(el));

// ─── ABOUT STORY: scroll-driven crossfade ─────────────────
(function initAboutStory() {
  const section    = document.querySelector('.about-story');
  if (!section) return;

  const textSlides = Array.from(section.querySelectorAll('.about-slide-text'));
  const imgSlides  = Array.from(section.querySelectorAll('.about-slide-image'));
  const dots       = Array.from(section.querySelectorAll('.about-prog-dot'));
  const counter    = section.querySelector('.about-counter-current');
  const NUM        = textSlides.length;  // 3

  /*
    Progress p = 0 → 1 across the scrollable distance of the section.
    Section height = 400vh, so scrollable = 300vh.
    Each slide gets 1/NUM = 1/3 of progress ≈ 100vh of scroll.

    TRANS controls the crossfade overlap (fraction of total progress).
    0.04 = ~12vh of blend time at each transition - snappy, less overlap.
  */
  const TRANS = 0.04;

  /**
   * Returns opacity [0–1] for slide i at scroll progress p.
   * Slide 0 starts fully visible (no fade-in).
   * Last slide ends fully visible (no fade-out).
   * Middle slides fade in then out.
   */
  function slideOpacity(p, i) {
    const segStart = i / NUM;
    const segEnd   = (i + 1) / NUM;

    if (i === 0) {
      // First slide: visible at p=0, fades out near its end
      if (p < segEnd - TRANS) return 1;
      return 1 - Math.min(1, (p - (segEnd - TRANS)) / (2 * TRANS));
    }

    if (i === NUM - 1) {
      // Last slide: fades in near its start, stays at 1
      if (p < segStart - TRANS) return 0;
      if (p < segStart + TRANS) return (p - (segStart - TRANS)) / (2 * TRANS);
      return 1;
    }

    // Middle slides: fade in then fade out
    if (p < segStart - TRANS) return 0;
    if (p < segStart + TRANS) return (p - (segStart - TRANS)) / (2 * TRANS);
    if (p < segEnd   - TRANS) return 1;
    if (p < segEnd   + TRANS) return 1 - (p - (segEnd - TRANS)) / (2 * TRANS);
    return 0;
  }

  function update() {
    // Skip scroll-driven logic on mobile; CSS handles the static fallback
    if (window.innerWidth <= 809) return;

    const vh       = window.innerHeight;
    const rect     = section.getBoundingClientRect();
    const scrolled = -rect.top;                        // px scrolled into section
    const scrollable = section.offsetHeight - vh;      // total scrollable px
    const p = Math.max(0, Math.min(1, scrolled / scrollable));

    let activeSlide = 0;

    for (let i = 0; i < NUM; i++) {
      const op  = Math.max(0, Math.min(1, slideOpacity(p, i)));
      const segMid = (i / NUM + (i + 1) / NUM) / 2;

      /*
        Y-axis motion:
        - Entering slide (before segment midpoint): arrives from +28px below
        - Exiting slide  (after segment midpoint):  departs to -28px above
        This creates a continuous upward-scrolling feel.
      */
      const dir = p < segMid ? 1 : -1;
      const ty  = op < 1 ? dir * (1 - op) * 28 : 0;

      // Text slide
      textSlides[i].style.opacity        = op;
      textSlides[i].style.transform      = `translateY(${ty.toFixed(1)}px)`;
      textSlides[i].style.pointerEvents  = op > 0.6 ? 'auto' : 'none';

      // Image slide - subtle scale-in as it appears
      imgSlides[i].style.opacity   = op;
      imgSlides[i].style.transform = `scale(${(1 + (1 - op) * 0.03).toFixed(4)})`;

      if (op >= 0.5) activeSlide = i;
    }

    // Update progress dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeSlide);
    });

    // Update slide counter
    if (counter) {
      counter.textContent = String(activeSlide + 1).padStart(2, '0');
    }
  }

  // Throttled scroll listener via rAF
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }
  }, { passive: true });

  // Also update on resize in case viewport height changes
  window.addEventListener('resize', update, { passive: true });

  update(); // initial render
})();

// ─── STATS: count-up animation ────────────────────────────
(function initCountUp() {
  const statEls = document.querySelectorAll('.stat-number');
  if (!statEls.length) return;

  function parsestat(text) {
    // Extract numeric value, prefix, suffix
    const clean = text.replace(/,/g, '');
    const match = clean.match(/^([^\d]*)(\d+)([^\d]*)$/);
    if (!match) return null;
    return { prefix: match[1], value: parseInt(match[2], 10), suffix: match[3] };
  }

  function formatNumber(n) {
    return n >= 1000 ? n.toLocaleString('en-US') : String(n);
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function countUp(el, from, to, prefix, suffix, duration) {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(from + (to - from) * easeOutQuart(progress));
      el.textContent = prefix + formatNumber(current) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const parsed = parsestat(el.dataset.original);
      if (!parsed) return;
      const delay = parseInt(el.closest('[data-delay]')?.dataset.delay || 0);
      const duration = 1200 - delay;
      setTimeout(() => countUp(el, 0, parsed.value, parsed.prefix, parsed.suffix, duration), delay);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.4 });

  statEls.forEach(el => {
    el.dataset.original = el.textContent.trim();
    countObserver.observe(el);
  });
})();

// ─── HERO HEADLINE: letter-by-letter pop animation ────────
(function initHeadlineLetters() {
  const headline = document.querySelector('.hero-headline');
  if (!headline) return;

  let charIndex = 0;
  const BASE_DELAY = 150; // ms - start shortly after eyebrow
  const PER_CHAR   = 14;  // ms between each letter

  function wrapTextNode(textNode) {
    const raw  = textNode.textContent.replace(/\s*\n\s*/g, '');
    if (!raw) { textNode.textContent = ''; return; }

    const frag = document.createDocumentFragment();
    for (const ch of raw) {
      const span = document.createElement('span');
      span.className = 'hero-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.animationDelay = `${BASE_DELAY + charIndex * PER_CHAR}ms`;
      charIndex++;
      frag.appendChild(span);
    }
    textNode.parentNode.replaceChild(frag, textNode);
  }

  Array.from(headline.childNodes).forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      wrapTextNode(child);
    } else if (child.nodeName === 'SPAN') {
      // accent span - wrap its inner text chars too
      Array.from(child.childNodes).forEach(inner => {
        if (inner.nodeType === Node.TEXT_NODE) wrapTextNode(inner);
      });
    }
    // BR nodes: leave as-is
  });
})();

// ─── HERO OFFER COUNTDOWN (evergreen 48h) ─────────────────
(function () {
  const root = document.getElementById('hero-countdown');
  if (!root) return;

  const PERIOD = 48 * 60 * 60 * 1000; // 48 hours in ms
  const KEY = 'performex_offer_deadline_v1';
  const nums = {
    hours: root.querySelector('[data-cd="hours"]'),
    minutes: root.querySelector('[data-cd="minutes"]'),
    seconds: root.querySelector('[data-cd="seconds"]'),
  };
  const pad = n => String(n).padStart(2, '0');

  // Deadline persists per visitor so reloads don't reset the clock.
  // First visit starts at 48h; when the clock hits zero it rolls to a new 48h window.
  function getDeadline() {
    let deadline = parseInt(localStorage.getItem(KEY), 10);
    if (!deadline || isNaN(deadline) || deadline <= Date.now()) {
      deadline = Date.now() + PERIOD;
      try { localStorage.setItem(KEY, String(deadline)); } catch (e) { /* private mode */ }
    }
    return deadline;
  }

  function set(el, value) {
    if (el.textContent === value) return;
    el.textContent = value;
    el.classList.remove('hero-cd-flash');
    void el.offsetWidth; // restart animation
    el.classList.add('hero-cd-flash');
  }

  function tick() {
    const remaining = getDeadline() - Date.now();
    const totalSeconds = Math.max(0, Math.floor(remaining / 1000));
    set(nums.hours, pad(Math.floor(totalSeconds / 3600)));
    set(nums.minutes, pad(Math.floor((totalSeconds % 3600) / 60)));
    set(nums.seconds, pad(totalSeconds % 60));
  }

  tick();
  setInterval(tick, 1000);
})();

