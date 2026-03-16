/* ================================================================
   NorWest Forge AI – Hero Network Animation
   Animated neural-network particle canvas for the hero section.
   ================================================================ */

(function () {
  'use strict';

  /* ── Palette ───────────────────────────────────────────────── */
  const C = {
    amber:      { hex: '#b5752a', rgb: '181,117,42'  },
    amberPale:  { hex: '#d4922f', rgb: '212,146,47'  },
    green:      { hex: '#2d5a3d', rgb: '45,90,61'    },
    greenLight: { hex: '#3a7350', rgb: '58,115,80'   },
    cream:      { hex: '#e8d9bc', rgb: '232,217,188' },
    white:      { hex: '#f5f0e8', rgb: '245,240,232' },
  };

  /* ── Concept labels ────────────────────────────────────────── */
  const LABELS = [
    { text: 'SIGNAL',     color: C.amberPale },
    { text: 'Ethics',     color: C.greenLight },
    { text: 'FERPA',      color: C.amber },
    { text: 'Mission',    color: C.greenLight },
    { text: 'Students',   color: C.cream },
    { text: 'Strategy',   color: C.amberPale },
    { text: 'Governance', color: C.green },
    { text: 'Trust',      color: C.cream },
    { text: 'Leadership', color: C.amber },
    { text: 'Equity',     color: C.greenLight },
    { text: 'Data',       color: C.amberPale },
    { text: 'Change',     color: C.cream },
  ];

  /* ── Helpers ───────────────────────────────────────────────── */
  function rand(min, max) { return min + Math.random() * (max - min); }
  function rgba(c, a)     { return 'rgba(' + c.rgb + ',' + a + ')'; }

  /* ── Particle class ────────────────────────────────────────── */
  class Particle {
    constructor(w, h, labelDef) {
      this.W = w;
      this.H = h;
      this.x  = rand(0, w);
      this.y  = rand(0, h);
      this.vx = rand(-0.28, 0.28);
      this.vy = rand(-0.28, 0.28);

      if (labelDef) {
        /* Concept node */
        this.label   = labelDef.text;
        this.color   = labelDef.color;
        this.r       = rand(3.5, 5.5);
        this.opacity = rand(0.80, 1.0);
        this.labeled = true;
      } else {
        /* Ambient node */
        this.label   = null;
        this.color   = Math.random() > 0.6 ? C.greenLight : C.amber;
        this.r       = rand(1.2, 2.8);
        this.opacity = rand(0.18, 0.55);
        this.labeled = false;
      }

      this.phase      = rand(0, Math.PI * 2);
      this.phaseSpeed = rand(0.012, 0.025);
      this.rings      = [];   /* active pulse rings */
    }

    /* Emit an expanding ring */
    pulse() {
      this.rings.push({ r: this.r + 2, alpha: 0.55 });
    }

    update() {
      this.phase += this.phaseSpeed;

      /* Drift */
      this.x += this.vx;
      this.y += this.vy;

      /* Wrap edges */
      if (this.x < -30) this.x = this.W + 30;
      if (this.x > this.W + 30) this.x = -30;
      if (this.y < -30) this.y = this.H + 30;
      if (this.y > this.H + 30) this.y = -30;

      /* Advance rings */
      this.rings = this.rings.filter(r => r.alpha > 0.01);
      for (const r of this.rings) {
        r.r     += 1.8;
        r.alpha -= 0.010;
      }
    }

    draw(ctx) {
      const pulseR = this.r + Math.sin(this.phase) * 0.9;

      /* ── Pulse rings ── */
      for (const ring of this.rings) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(this.color, ring.alpha);
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      /* ── Outer glow (concept nodes only) ── */
      if (this.labeled) {
        const grd = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, pulseR * 6
        );
        grd.addColorStop(0, rgba(this.color, 0.22));
        grd.addColorStop(1, rgba(this.color, 0));
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseR * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      /* ── Core dot ── */
      ctx.beginPath();
      ctx.arc(this.x, this.y, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = rgba(this.color, this.opacity);
      ctx.fill();

      /* ── Label ── */
      if (this.label) {
        ctx.font         = '500 10px "Inter", system-ui, sans-serif';
        ctx.fillStyle    = rgba(this.color, this.opacity * 0.85);
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label.toUpperCase(), this.x + pulseR + 6, this.y);
      }
    }
  }

  /* ── Main canvas controller ────────────────────────────────── */
  class HeroNetwork {
    constructor(canvas) {
      this.canvas       = canvas;
      this.ctx          = canvas.getContext('2d');
      this.particles    = [];
      this.raf          = null;
      this.lastPulseAt  = 0;
      this.pulseGap     = 2800;   /* ms between auto-pulses */

      this._resize = () => this.resize();
      window.addEventListener('resize', this._resize);

      this.resize();
      this.build();
      this.start();
    }

    /* Size canvas to fill hero */
    resize() {
      const hero = this.canvas.parentElement;
      this.canvas.width  = hero.offsetWidth  || window.innerWidth;
      this.canvas.height = hero.offsetHeight || window.innerHeight;
      /* Rebuild after resize so nodes fill new dimensions */
      if (this.particles.length) this.build();
    }

    /* Create particle set */
    build() {
      this.particles = [];
      const W = this.canvas.width;
      const H = this.canvas.height;
      const area    = W * H;
      const ambient = Math.max(40, Math.min(80, Math.floor(area / 11000)));

      /* Concept nodes */
      for (const def of LABELS) {
        this.particles.push(new Particle(W, H, def));
      }
      /* Ambient nodes */
      for (let i = 0; i < ambient; i++) {
        this.particles.push(new Particle(W, H, null));
      }
    }

    /* Draw all connections */
    drawEdges() {
      const ctx = this.ctx;
      const pts = this.particles;
      const MAX = 175;

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a  = pts[i];
          const b  = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d >= MAX) continue;

          const t   = 1 - d / MAX;
          const prominent = a.labeled && b.labeled;
          const alpha = prominent ? t * 0.45 : t * 0.18;

          /* Gradient line blending both node colours */
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, rgba(a.color, alpha));
          grad.addColorStop(1, rgba(b.color, alpha));

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = prominent ? 1.4 : 0.6;
          ctx.stroke();
        }
      }
    }

    /* Auto-pulse a random concept node */
    autoPulse(now) {
      if (now - this.lastPulseAt < this.pulseGap) return;
      this.lastPulseAt = now;
      const labeled = this.particles.filter(p => p.labeled);
      if (labeled.length) {
        labeled[Math.floor(Math.random() * labeled.length)].pulse();
      }
    }

    /* Main render loop */
    render(ts) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.autoPulse(ts);
      this.drawEdges();

      for (const p of this.particles) {
        p.update();
        p.draw(ctx);
      }

      this.raf = requestAnimationFrame(ts => this.render(ts));
    }

    start() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(ts => this.render(ts));
    }

    destroy() {
      if (this.raf) cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this._resize);
    }
  }

  /* ── Boot ───────────────────────────────────────────────────── */
  function boot() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    new HeroNetwork(canvas);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
