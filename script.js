/* ============================================================
   APEX AI CONSULTING — JS v3 with Graphics & Animations
   ============================================================ */

// ── Nav scroll behavior ──────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── Mobile nav toggle ────────────────────────────────────────
const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  const spans = toggle.querySelectorAll('span');
  if (open) {
    spans[0].style.cssText = 'transform: rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.cssText = 'transform: rotate(-45deg) translate(5px, -5px)';
  } else {
    spans.forEach(s => s.style.cssText = '');
  }
});
links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.querySelectorAll('span').forEach(s => s.style.cssText = '');
  });
});

// ── Wave Dividers (injected SVGs) ────────────────────────────
function injectWaves() {
  const waveDefs = [
    {
      sel: '.wave-divider--white-to-cream',
      fill: '#f5f0e8',
      bg: '#ffffff',
      path: 'M0,0 C240,60 480,0 720,40 C960,80 1200,10 1440,30 L1440,60 L0,60 Z'
    },
    {
      sel: '.wave-divider--cream-to-forest',
      fill: '#2d5a3d',
      bg: '#f5f0e8',
      path: 'M0,30 C360,0 720,60 1080,20 C1260,5 1380,40 1440,20 L1440,60 L0,60 Z'
    },
    {
      sel: '.wave-divider--forest-to-cream',
      fill: '#f5f0e8',
      bg: '#2d5a3d',
      path: 'M0,20 C180,50 360,0 720,35 C1080,65 1260,15 1440,40 L1440,60 L0,60 Z'
    },
    {
      sel: '.wave-divider--white-to-dark',
      fill: '#191714',
      bg: '#ffffff',
      path: 'M0,40 C300,0 600,60 900,20 C1200,-15 1350,45 1440,30 L1440,60 L0,60 Z'
    },
    {
      sel: '.wave-divider--dark-to-cream',
      fill: '#f5f0e8',
      bg: '#191714',
      path: 'M0,25 C240,60 600,0 900,40 C1100,65 1300,20 1440,45 L1440,60 L0,60 Z'
    }
  ];

  waveDefs.forEach(w => {
    const el = document.querySelector(w.sel);
    if (!el) return;
    el.style.background = w.bg;
    el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px">
        <path d="${w.path}" fill="${w.fill}"/>
      </svg>`;
  });
}
injectWaves();

// ── Animated Stat Counters ───────────────────────────────────
function animateCounters() {
  const nums = document.querySelectorAll('.ring-num[data-target]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target) || target === 0) return;
      let start = 0;
      const duration = 1800;
      const step = timestamp => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => observer.observe(n));
}
animateCounters();

// ── Scroll-reveal animations ─────────────────────────────────
const revealSelectors = [
  '.fw-step', '.svc-card', '.testi-card', '.ev-item', '.hiw-step',
  '.stat-ring-item', '.ct-row', '.col-option', '.ib-type',
  '.about-story p', '.fq-item', '.ac-item', '.resource-list li',
  '.sd-step', '.diff-left', '.diff-right',
];
const allReveal = document.querySelectorAll(revealSelectors.join(', '));
allReveal.forEach(el => el.classList.add('reveal'));

const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const parent = entry.target.parentElement;
    const sibs = [...parent.querySelectorAll('.reveal')];
    const idx = sibs.indexOf(entry.target);
    entry.target.style.transitionDelay = `${Math.min(idx * 65, 360)}ms`;
    entry.target.classList.add('in-view');
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });

allReveal.forEach(el => revealObs.observe(el));

// ── SIGNAL step hover interaction ───────────────────────────
document.querySelectorAll('.sd-step').forEach((step, i) => {
  // Also highlight the matching fw-step
  step.addEventListener('mouseenter', () => {
    const fwSteps = document.querySelectorAll('.fw-step');
    if (fwSteps[i]) {
      fwSteps[i].style.background = 'rgba(181,117,42,0.04)';
      fwSteps[i].style.borderRadius = '12px';
      fwSteps[i].style.paddingLeft = '16px';
      fwSteps[i].style.paddingRight = '16px';
    }
  });
  step.addEventListener('mouseleave', () => {
    const fwSteps = document.querySelectorAll('.fw-step');
    if (fwSteps[i]) {
      fwSteps[i].style.background = '';
      fwSteps[i].style.borderRadius = '';
      fwSteps[i].style.paddingLeft = '';
      fwSteps[i].style.paddingRight = '';
    }
  });
});

// ── Hero blob mouse parallax ─────────────────────────────────
const b1 = document.querySelector('.blob--1');
const b2 = document.querySelector('.blob--2');
window.addEventListener('mousemove', e => {
  if (!b1 || !b2) return;
  const cx = e.clientX / window.innerWidth - 0.5;
  const cy = e.clientY / window.innerHeight - 0.5;
  b1.style.transform = `translate(${cx * 25}px, ${cy * 18}px)`;
  b2.style.transform = `translate(${-cx * 18}px, ${-cy * 14}px)`;
}, { passive: true });

// ── Active nav section highlight ─────────────────────────────
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navAnchors.forEach(a => {
      a.style.color = '';
      if (a.getAttribute('href') === `#${entry.target.id}`) a.style.color = '#d4922f';
    });
  });
}, { threshold: 0.3 });
sections.forEach(s => sectionObs.observe(s));

// ── Lead magnet form ─────────────────────────────────────────
const resourceForm = document.getElementById('resourceForm');
if (resourceForm) {
  resourceForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = resourceForm.querySelector('button');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '✓ Check your inbox!';
      btn.style.background = '#2d5a3d';
      resourceForm.reset();
    }, 900);
  });
}

// ── Contact form ─────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    setTimeout(() => {
      btn.textContent = '✓ Message received — I\'ll reply within 48 hours.';
      btn.style.background = '#2d5a3d';
      btn.style.borderColor = '#2d5a3d';
      contactForm.reset();
    }, 1200);
  });
}
