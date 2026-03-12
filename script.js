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
    0.04 = ~12vh of blend time at each transition — snappy, less overlap.
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

      // Image slide — subtle scale-in as it appears
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

