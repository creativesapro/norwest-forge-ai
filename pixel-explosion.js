/**
 * APEX AI CONSULTING — Pixel Explosion Engine
 * Canvas-based particle system:
 *   → On load:  particles scatter → assemble into the graphic
 *   → On click: particles explode outward with physics → reform
 *   → At rest:  particles gently breathe/oscillate
 */

(function () {
  'use strict';

  /* ─── CONFIG ──────────────────────────────────────────────── */
  const CFG = {
    sampleStep:    5,       // Sample every Nth pixel (lower = more particles, slower)
    pixelSize:     3,       // Size of each rendered particle in px
    explodeSpeed:  [10, 28],// [min, max] explosion velocity
    springStrength:0.09,    // How fast particles spring home
    damping:       0.80,    // Velocity damping while reforming
    gravity:       0.35,    // Gravity during explosion
    friction:      0.94,    // Friction during explosion
    idleAmplitude: 0.55,    // Idle breathing amplitude
    settleThreshold:0.8,    // Distance (px) to snap to home
    reformDelay:   2200,    // ms before particles start reforming after explosion
    hintFadeAfter: 4000,    // ms to fade the "click me" hint
  };

  /* ─── PARTICLE CLASS ──────────────────────────────────────── */
  class Particle {
    constructor(homeX, homeY, r, g, b, a) {
      this.homeX = homeX;
      this.homeY = homeY;
      this.x     = homeX;
      this.y     = homeY;
      this.r = r; this.g = g; this.b = b; this.a = a;
      this.vx = 0;
      this.vy = 0;
      this.state = 'idle'; // idle | exploding | reforming

      // Unique idle oscillation params per particle
      this.idlePhaseX  = Math.random() * Math.PI * 2;
      this.idlePhaseY  = Math.random() * Math.PI * 2;
      this.idleSpeedX  = 0.018 + Math.random() * 0.018;
      this.idleSpeedY  = 0.014 + Math.random() * 0.018;
      this.idleAmpX    = (Math.random() - 0.5) * 2;
      this.idleAmpY    = (Math.random() - 0.5) * 2;
      this.tick        = Math.random() * 200;
    }

    explode(cx, cy) {
      this.state = 'exploding';
      // Direction away from center + randomness
      const dx    = this.homeX - cx;
      const dy    = this.homeY - cy;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.8;
      const spd   = CFG.explodeSpeed[0] + Math.random() * (CFG.explodeSpeed[1] - CFG.explodeSpeed[0]);
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd - Math.random() * 4; // slight upward bias
    }

    reform() {
      this.state = 'reforming';
    }

    update() {
      this.tick++;

      if (this.state === 'exploding') {
        this.x  += this.vx;
        this.y  += this.vy;
        this.vx *= CFG.friction;
        this.vy *= CFG.friction;
        this.vy += CFG.gravity;

      } else if (this.state === 'reforming') {
        const dx   = this.homeX - this.x;
        const dy   = this.homeY - this.y;
        this.vx   += dx * CFG.springStrength;
        this.vy   += dy * CFG.springStrength;
        this.vx   *= CFG.damping;
        this.vy   *= CFG.damping;
        this.x    += this.vx;
        this.y    += this.vy;
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist < CFG.settleThreshold && Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
          this.x  = this.homeX;
          this.y  = this.homeY;
          this.vx = 0;
          this.vy = 0;
          this.state = 'idle';
        }

      } else {
        // Idle: organic Lissajous breathing
        this.x = this.homeX + Math.sin(this.tick * this.idleSpeedX + this.idlePhaseX) * CFG.idleAmplitude * this.idleAmpX;
        this.y = this.homeY + Math.cos(this.tick * this.idleSpeedY + this.idlePhaseY) * CFG.idleAmplitude * this.idleAmpY;
      }
    }

    draw(ctx) {
      const alpha = this.state === 'exploding'
        ? Math.max(0.2, (this.a / 255) * 0.85)
        : this.a / 255;
      ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${alpha.toFixed(2)})`;
      ctx.fillRect(Math.round(this.x), Math.round(this.y), CFG.pixelSize, CFG.pixelSize);
    }
  }

  /* ─── DRAW SOURCE GRAPHIC ─────────────────────────────────── */
  function buildSource(W, H) {
    const off = document.createElement('canvas');
    off.width  = W;
    off.height = H;
    const c = off.getContext('2d');

    const cx = W / 2;
    const cy = H / 2 - 18;

    /* ── outer ambient glow ring ── */
    const glowGrad = c.createRadialGradient(cx, cy, 40, cx, cy, W * 0.48);
    glowGrad.addColorStop(0,   'rgba(181,117,42,0.18)');
    glowGrad.addColorStop(0.5, 'rgba(181,117,42,0.06)');
    glowGrad.addColorStop(1,   'rgba(181,117,42,0)');
    c.fillStyle = glowGrad;
    c.beginPath();
    c.arc(cx, cy, W * 0.48, 0, Math.PI * 2);
    c.fill();

    /* ── helper: hexagon path ── */
    function hexPath(ctx, x, y, r, rotation = -Math.PI / 6) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = rotation + (i * Math.PI) / 3;
        i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      ctx.closePath();
    }

    const hexR = Math.min(W, H) * 0.30;

    /* ── orbital nodes + spokes ── */
    const orbitR  = hexR * 1.52;
    const nodeR   = 9;
    const nodeColors = ['#d4922f','#3a7350','#d4922f','#3a7350','#d4922f','#3a7350'];
    const nodeLabels = ['S','I','G','N','A','L'];

    for (let i = 0; i < 6; i++) {
      const ang  = i * (Math.PI / 3) - Math.PI / 6;
      const nx   = cx + orbitR * Math.cos(ang);
      const ny   = cy + orbitR * Math.sin(ang);
      const hex1 = { x: cx + hexR * Math.cos(ang), y: cy + hexR * Math.sin(ang) };

      // spoke
      c.beginPath();
      c.moveTo(hex1.x, hex1.y);
      c.lineTo(nx, ny);
      c.strokeStyle = 'rgba(181,117,42,0.28)';
      c.lineWidth = 1.5;
      c.setLineDash([3, 5]);
      c.stroke();
      c.setLineDash([]);

      // node glow
      const ng = c.createRadialGradient(nx, ny, 0, nx, ny, nodeR * 2.2);
      ng.addColorStop(0, nodeColors[i] + 'aa');
      ng.addColorStop(1, nodeColors[i] + '00');
      c.beginPath();
      c.arc(nx, ny, nodeR * 2.2, 0, Math.PI * 2);
      c.fillStyle = ng;
      c.fill();

      // node fill
      c.beginPath();
      c.arc(nx, ny, nodeR, 0, Math.PI * 2);
      c.fillStyle = nodeColors[i];
      c.fill();
      c.strokeStyle = 'rgba(245,240,232,0.5)';
      c.lineWidth = 1.5;
      c.stroke();

      // node letter
      c.font = `700 ${nodeR * 1.2}px 'Inter', sans-serif`;
      c.fillStyle = 'rgba(245,240,232,0.9)';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(nodeLabels[i], nx, ny + 0.5);
    }

    /* ── outer hex ring ── */
    hexPath(c, cx, cy, hexR + 14);
    c.strokeStyle = 'rgba(181,117,42,0.18)';
    c.lineWidth = 1;
    c.stroke();

    /* ── main hex body ── */
    hexPath(c, cx, cy, hexR);
    const hexGrad = c.createRadialGradient(cx - hexR * 0.25, cy - hexR * 0.25, 0, cx, cy, hexR);
    hexGrad.addColorStop(0,   '#f0d49a');
    hexGrad.addColorStop(0.4, '#d4922f');
    hexGrad.addColorStop(1,   '#6e4518');
    c.fillStyle = hexGrad;
    c.fill();
    c.strokeStyle = 'rgba(240,212,154,0.5)';
    c.lineWidth = 2;
    c.stroke();

    /* ── inner hex ring ── */
    hexPath(c, cx, cy, hexR * 0.72);
    c.strokeStyle = 'rgba(240,212,154,0.2)';
    c.lineWidth = 1.2;
    c.stroke();

    /* ── "AI" text ── */
    const fontSize = hexR * 1.05;
    c.font = `600 ${fontSize}px 'Newsreader', Georgia, serif`;
    c.textAlign    = 'center';
    c.textBaseline = 'middle';
    // subtle shadow
    c.fillStyle = 'rgba(10,8,5,0.4)';
    c.fillText('AI', cx + 2, cy + 3);
    // main text
    c.fillStyle = 'rgba(20,16,10,0.88)';
    c.fillText('AI', cx, cy + 1);

    /* ── "STRATEGY" micro text inside hex ── */
    c.font      = `700 ${hexR * 0.13}px 'Inter', sans-serif`;
    c.fillStyle = 'rgba(20,16,10,0.55)';
    c.fillText('STRATEGY', cx, cy + hexR * 0.5);

    /* ── sparkle dots scattered around ── */
    const sparkPositions = [
      [cx - hexR * 2.0, cy - hexR * 0.6],
      [cx + hexR * 2.0, cy - hexR * 0.4],
      [cx + hexR * 0.4, cy - hexR * 1.9],
      [cx - hexR * 0.3, cy + hexR * 1.9],
      [cx + hexR * 1.6, cy + hexR * 1.4],
      [cx - hexR * 1.7, cy + hexR * 1.3],
    ];
    sparkPositions.forEach(([sx, sy], idx) => {
      const sr = idx % 2 === 0 ? 3 : 2;
      c.beginPath();
      c.arc(sx, sy, sr, 0, Math.PI * 2);
      c.fillStyle = idx % 3 === 0 ? 'rgba(181,117,42,0.7)' : 'rgba(122,173,138,0.6)';
      c.fill();
    });

    /* ── horizontal scan lines (subtle texture) ── */
    c.globalAlpha = 0.04;
    for (let y = 0; y < H; y += 3) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.strokeStyle = '#ffffff';
      c.lineWidth = 0.5;
      c.stroke();
    }
    c.globalAlpha = 1;

    return off;
  }

  /* ─── SAMPLE PIXELS INTO PARTICLES ───────────────────────── */
  function sampleParticles(source, step) {
    const ctx  = source.getContext('2d');
    const W    = source.width;
    const H    = source.height;
    const data = ctx.getImageData(0, 0, W, H).data;
    const out  = [];

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const i = (y * W + x) * 4;
        const a = data[i + 3];
        if (a > 40) {
          out.push(new Particle(x, y, data[i], data[i + 1], data[i + 2], a));
        }
      }
    }
    return out;
  }

  /* ─── CLICK HINT RING ANIMATION ──────────────────────────── */
  function drawHint(ctx, cx, cy, R, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(181,117,42,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // "Click to explore" label
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(240,212,154,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Click to explore', cx, cy + R + 18);
    ctx.restore();
  }

  /* ─── MAIN INIT ───────────────────────────────────────────── */
  function init() {
    const canvas = document.getElementById('pixelCanvas');
    if (!canvas) return;

    const W   = canvas.width;
    const H   = canvas.height;
    const ctx = canvas.getContext('2d');
    canvas.style.cursor = 'pointer';

    /* Build graphic + particles */
    const source    = buildSource(W, H);
    const particles = sampleParticles(source, CFG.sampleStep);
    const cx = W / 2;
    const cy = H / 2;

    /* Scatter particles to random positions for the assembly animation */
    particles.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 80 + Math.random() * (W * 0.55);
      p.x = cx + Math.cos(angle) * dist;
      p.y = cy + Math.sin(angle) * dist;
      p.vx = (Math.random() - 0.5) * 3;
      p.vy = (Math.random() - 0.5) * 3;
      p.state = 'reforming';
    });

    /* State */
    let locked       = false;   // prevent double-explosion while animating
    let hintAlpha    = 0;       // fade in the hint ring
    let hintFading   = false;
    let hintTimer    = null;
    let hintPulse    = 0;       // pulsing ring radius
    let allSettled   = false;
    let rafId        = null;

    /* Pulse ring state */
    let pulseRings = []; // { r, alpha }

    /* ── ANIMATION LOOP ── */
    function animate() {
      ctx.clearRect(0, 0, W, H);

      /* Check if all particles are settled */
      if (!allSettled) {
        const stillMoving = particles.some(p => p.state !== 'idle');
        if (!stillMoving) {
          allSettled = true;
          /* Fade in the hint */
          let t = 0;
          const fadeIn = setInterval(() => {
            t += 0.04;
            hintAlpha = Math.min(1, t);
            if (t >= 1) clearInterval(fadeIn);
          }, 30);
          hintTimer = setTimeout(() => {
            hintFading = true;
          }, CFG.hintFadeAfter);
        }
      }

      /* Fade out hint after delay */
      if (hintFading && hintAlpha > 0) {
        hintAlpha = Math.max(0, hintAlpha - 0.012);
        if (hintAlpha <= 0) hintFading = false;
      }

      /* Draw particles */
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      /* Draw hint ring */
      hintPulse += 0.03;
      if (hintAlpha > 0) {
        const baseR = Math.min(W, H) * 0.44;
        const r = baseR + Math.sin(hintPulse) * 5;
        drawHint(ctx, cx, cy, r, hintAlpha * 0.75);
      }

      /* Draw pulse rings (after explosion) */
      pulseRings = pulseRings.filter(ring => ring.alpha > 0.01);
      pulseRings.forEach(ring => {
        ring.r     += 4;
        ring.alpha *= 0.94;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(181,117,42,${ring.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      rafId = requestAnimationFrame(animate);
    }

    animate();

    /* ── EXPLOSION TRIGGER ── */
    function triggerExplosion() {
      if (locked) return;
      locked = true;
      allSettled = false;

      // Cancel hint
      clearTimeout(hintTimer);
      hintAlpha  = 0;
      hintFading = false;

      // Launch 3 pulse rings
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          pulseRings.push({ r: 20 + i * 15, alpha: 0.6 - i * 0.15 });
        }, i * 80);
      }

      // Explode all particles
      particles.forEach(p => p.explode(cx, cy));

      // Schedule reform
      setTimeout(() => {
        particles.forEach(p => p.reform());
        // Release lock after particles settle
        setTimeout(() => {
          locked = false;
          allSettled = true; // show hint again
          let t = 0;
          const fadeIn = setInterval(() => {
            t += 0.04;
            hintAlpha = Math.min(1, t);
            if (t >= 1) clearInterval(fadeIn);
          }, 30);
          hintTimer = setTimeout(() => { hintFading = true; }, CFG.hintFadeAfter);
        }, 2500);
      }, CFG.reformDelay);
    }

    canvas.addEventListener('click', triggerExplosion);

    /* Touch support */
    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      triggerExplosion();
    }, { passive: false });

    /* Keyboard: press Space or Enter when canvas is focused */
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'button');
    canvas.setAttribute('aria-label', 'Interactive AI strategy graphic — click to explore');
    canvas.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        triggerExplosion();
      }
    });
  }

  /* ─── BOOT ────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay so fonts are ready for canvas text rendering
    setTimeout(init, 100);
  }

})();
