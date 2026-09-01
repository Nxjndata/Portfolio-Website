// ==========================================================================
// Configuration & State
// ==========================================================================
const FRAME_COUNT = 192;
const FRAME_PATH = (index) => `frames/frame-${String(index).padStart(4, '0')}.jpg`;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const introCanvas = document.getElementById('intro-canvas');
const introCtx = introCanvas ? introCanvas.getContext('2d') : null;
const introOverlay = document.getElementById('netflix-intro');
const navbar = document.querySelector('.navbar');

const images = new Array(FRAME_COUNT);
let targetProgress = 0;
let currentProgress = 0;
let lastRenderedIndex = -1;
let loadedCount = 0;
let isIntroActive = true;
let introRafId = null;

// ==========================================================================
// Netflix Cinematic "NK" Intro Engine
// ==========================================================================
class NetflixCinematicIntro {
  constructor(canvasEl, ctxEl, onComplete) {
    this.canvas = canvasEl;
    this.ctx = ctxEl;
    this.onComplete = onComplete;
    this.startTime = null;
    this.duration = 3.4; // 3.4 seconds total sequence
    this.trails = [];
    this.isDone = false;
    this.initTrails();
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  initTrails() {
    const palette = [
      '#e50914', '#ff2330', '#ff003c', '#b81d24',
      '#ff3b45', '#99000a', '#ff4d58', '#6a040f'
    ];
    this.trails = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      this.trails.push({
        x: (Math.random() - 0.5) * 320, // Spread across "NK" width
        y: (Math.random() - 0.5) * 300,
        vy: Math.random() * 480 + 260,
        length: Math.random() * 300 + 140,
        width: Math.random() * 3.5 + 1.2,
        color: palette[i % palette.length],
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  start() {
    this.startTime = performance.now();
    this.render = this.render.bind(this);
    introRafId = requestAnimationFrame(this.render);
    playCinematicTaDum();
  }

  skip() {
    if (this.isDone) return;
    this.isDone = true;
    if (introRafId) cancelAnimationFrame(introRafId);
    this.onComplete();
  }

  render(now) {
    if (this.isDone) return;

    const elapsed = (now - this.startTime) / 1000;
    const t = Math.min(elapsed, this.duration);

    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // -------------------------------------------------------------
    // PHASE 1: [0.0s - 0.95s] - Emergence & 3D "NK" Red Ribbon Formation
    // -------------------------------------------------------------
    if (t < 1.9) {
      const riseProgress = Math.min(1, t / 0.85);
      const easeRise = 1 - Math.pow(1 - riseProgress, 3);

      // Camera scale / zoom into center
      let scale = 1.0;
      let zoomAlpha = 1.0;
      if (t > 0.95) {
        const zoomProg = (t - 0.95) / 0.95;
        scale = 1.0 + Math.pow(zoomProg, 2.5) * 8.5;
        zoomAlpha = Math.max(0, 1 - Math.pow(zoomProg, 2));
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = zoomAlpha;

      // Anamorphic red ambient back-glow
      const glowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 260);
      glowGrad.addColorStop(0, `rgba(229, 9, 20, ${0.38 * easeRise})`);
      glowGrad.addColorStop(0.5, `rgba(184, 29, 36, ${0.14 * easeRise})`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 260, 0, Math.PI * 2);
      ctx.fill();

      // "NK" Geometry
      const nW = 85;
      const kW = 85;
      const gap = 24;
      const totalW = nW + gap + kW; // 194
      const halfW = totalW / 2; // 97
      const nH = 175;
      const halfH = nH / 2; // 87.5
      const ribbonW = 24;

      // Clip for upward emergence
      ctx.save();
      const clipY = halfH - (nH * easeRise);
      ctx.beginPath();
      ctx.rect(-halfW - 30, clipY - 10, totalW + 60, nH * easeRise + 20);
      ctx.clip();

      // ==========================================
      // LETTER "N" RIBBONS
      // ==========================================
      const nLeft = -halfW;
      const nRight = nLeft + nW;

      // 1. N Left Vertical Ribbon (Dark Crimson)
      const gradNLeft = ctx.createLinearGradient(0, -halfH, 0, halfH);
      gradNLeft.addColorStop(0, '#b81d24');
      gradNLeft.addColorStop(1, '#660007');
      ctx.fillStyle = gradNLeft;
      ctx.beginPath();
      ctx.rect(nLeft, -halfH, ribbonW, nH);
      ctx.fill();

      // 2. N Right Vertical Ribbon (Deep Wine Red)
      const gradNRight = ctx.createLinearGradient(0, -halfH, 0, halfH);
      gradNRight.addColorStop(0, '#8f1218');
      gradNRight.addColorStop(1, '#4d0005');
      ctx.fillStyle = gradNRight;
      ctx.beginPath();
      ctx.rect(nRight - ribbonW, -halfH, ribbonW, nH);
      ctx.fill();

      // 3. N Center Diagonal Ribbon (Foreground - Bright Scarlet)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetX = -4;
      ctx.shadowOffsetY = 4;

      const gradNDiag = ctx.createLinearGradient(nLeft, -halfH, nRight, halfH);
      gradNDiag.addColorStop(0, '#ff2330');
      gradNDiag.addColorStop(0.3, '#e50914');
      gradNDiag.addColorStop(0.8, '#b81d24');
      gradNDiag.addColorStop(1, '#e50914');
      ctx.fillStyle = gradNDiag;

      ctx.beginPath();
      ctx.moveTo(nLeft, -halfH);
      ctx.lineTo(nLeft + ribbonW, -halfH);
      ctx.lineTo(nRight, halfH);
      ctx.lineTo(nRight - ribbonW, halfH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Specular highlight line along N diagonal
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(nLeft, -halfH);
      ctx.lineTo(nRight - ribbonW, halfH);
      ctx.stroke();

      // ==========================================
      // LETTER "K" RIBBONS
      // ==========================================
      const kLeft = nRight + gap;
      const kRight = kLeft + kW;

      // 1. K Left Stem Ribbon (Dark Crimson)
      const gradKStem = ctx.createLinearGradient(0, -halfH, 0, halfH);
      gradKStem.addColorStop(0, '#b81d24');
      gradKStem.addColorStop(1, '#660007');
      ctx.fillStyle = gradKStem;
      ctx.beginPath();
      ctx.rect(kLeft, -halfH, ribbonW, nH);
      ctx.fill();

      // 2. K Top Diagonal Branch (Bright Crimson)
      const gradKTop = ctx.createLinearGradient(kLeft + ribbonW, 0, kRight, -halfH);
      gradKTop.addColorStop(0, '#e50914');
      gradKTop.addColorStop(0.6, '#ff2330');
      gradKTop.addColorStop(1, '#b81d24');
      ctx.fillStyle = gradKTop;

      ctx.beginPath();
      ctx.moveTo(kLeft + ribbonW, 4);
      ctx.lineTo(kLeft + ribbonW, -22);
      ctx.lineTo(kRight - 4, -halfH);
      ctx.lineTo(kRight + 16, -halfH);
      ctx.closePath();
      ctx.fill();

      // 3. K Bottom Diagonal Leg (Foreground - Bright Scarlet with Drop Shadow)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetX = -4;
      ctx.shadowOffsetY = 4;

      const gradKBottom = ctx.createLinearGradient(kLeft + 10, -10, kRight, halfH);
      gradKBottom.addColorStop(0, '#ff2330');
      gradKBottom.addColorStop(0.4, '#e50914');
      gradKBottom.addColorStop(1, '#b81d24');
      ctx.fillStyle = gradKBottom;

      ctx.beginPath();
      ctx.moveTo(kLeft + 12, -8);
      ctx.lineTo(kLeft + ribbonW + 12, 10);
      ctx.lineTo(kRight + 10, halfH);
      ctx.lineTo(kRight - 14, halfH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Specular highlight on K bottom leg
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(kLeft + 12, -8);
      ctx.lineTo(kRight - 14, halfH);
      ctx.stroke();

      ctx.restore(); // end clip
      ctx.restore(); // end translate/scale
    }

    // -------------------------------------------------------------
    // PHASE 2: [0.85s - 2.4s] - Volumetric Vertical Light Trails
    // -------------------------------------------------------------
    if (t > 0.85 && t < 2.8) {
      const trailPhase = (t - 0.85) / 1.6;
      const trailAlpha = t < 2.1 ? Math.min(1, (t - 0.85) / 0.3) : Math.max(0, 1 - (t - 2.1) / 0.7);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = trailAlpha;

      for (let i = 0; i < this.trails.length; i++) {
        const tr = this.trails[i];
        const currentY = tr.y + tr.vy * (t - 0.85);
        const wrappedY = ((currentY + h) % (h * 1.6)) - (h * 0.8);
        const streakLen = tr.length * (1 + trailPhase * 1.8);
        const streakW = tr.width * (1 + trailPhase * 0.8);

        const beamGrad = ctx.createLinearGradient(0, wrappedY - streakLen / 2, 0, wrappedY + streakLen / 2);
        beamGrad.addColorStop(0, 'rgba(0,0,0,0)');
        beamGrad.addColorStop(0.3, tr.color);
        beamGrad.addColorStop(0.5, '#ffffff');
        beamGrad.addColorStop(0.7, tr.color);
        beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = beamGrad;
        ctx.fillRect(tr.x - streakW / 2, wrappedY - streakLen / 2, streakW, streakLen);
      }

      // Anamorphic horizontal lens flare line
      if (t > 1.1 && t < 2.0) {
        const flareProg = (t - 1.1) / 0.9;
        const flareAlpha = Math.sin(flareProg * Math.PI) * 0.85;
        const flareGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.6);
        flareGrad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha})`);
        flareGrad.addColorStop(0.2, `rgba(229, 9, 20, ${flareAlpha * 0.8})`);
        flareGrad.addColorStop(0.6, `rgba(184, 29, 36, ${flareAlpha * 0.25})`);
        flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flareGrad;
        ctx.fillRect(-w / 2, -3, w, 6);
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // PHASE 3: [1.8s - 3.4s] - Pure Clean Name Reveal: NIRANJAN KANNAN
    // (Adaptive sizing guarantees zero clipping on any phone or desktop screen)
    // -------------------------------------------------------------
    if (t > 1.8) {
      const nameT = t - 1.8;
      const revealProg = Math.min(1, nameT / 0.6);
      const easeReveal = 1 - Math.pow(1 - revealProg, 3);

      const nameScale = 0.96 + (nameT / 1.6) * 0.06;
      const nameAlpha = t > 3.0 ? Math.max(0, 1 - (t - 3.0) / 0.35) : Math.min(1, nameT / 0.35);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(nameScale, nameScale);
      ctx.globalAlpha = nameAlpha;

      const isMobile = w < 640;
      let baseFontSize = Math.min(42, Math.max(14, w * (isMobile ? 0.052 : 0.038)));
      let maxLetterSpacing = isMobile ? Math.max(3, w * 0.016) : 14;
      let letterSpacing = (maxLetterSpacing * 0.6) + easeReveal * (maxLetterSpacing * 0.4);

      ctx.font = `800 ${baseFontSize}px 'Outfit', -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = 'NIRANJAN  KANNAN';
      
      let totalTextW = 0;
      for (let i = 0; i < text.length; i++) {
        totalTextW += ctx.measureText(text[i]).width + letterSpacing;
      }
      totalTextW -= letterSpacing;

      // Auto-fit guard: ensure text never exceeds 86% of viewport at peak expansion
      const maxAllowedW = (w * 0.86) / nameScale;
      if (totalTextW > maxAllowedW) {
        const fitRatio = maxAllowedW / totalTextW;
        baseFontSize = Math.max(12, Math.floor(baseFontSize * fitRatio));
        letterSpacing = Math.max(2, letterSpacing * fitRatio);
        ctx.font = `800 ${baseFontSize}px 'Outfit', -apple-system, sans-serif`;

        // Recalculate fitted width
        totalTextW = 0;
        for (let i = 0; i < text.length; i++) {
          totalTextW += ctx.measureText(text[i]).width + letterSpacing;
        }
        totalTextW -= letterSpacing;
      }

      let startX = -totalTextW / 2;

      // Anamorphic scan line over text
      const scanX = -totalTextW * 0.8 + (nameT / 1.2) * (totalTextW * 1.6);

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charW = ctx.measureText(char).width;
        const charX = startX + charW / 2;

        const distToScan = Math.abs(charX - scanX);
        const scanBoost = Math.max(0, 1 - distToScan / 80);

        ctx.save();
        ctx.shadowColor = scanBoost > 0.3 ? '#ffffff' : '#e50914';
        ctx.shadowBlur = 10 + scanBoost * 22;

        if (scanBoost > 0.4) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.94 + scanBoost * 0.06})`;
        }

        ctx.fillText(char, charX, 0);
        ctx.restore();

        startX += charW + letterSpacing;
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // PHASE 4: [3.1s - 3.4s] - Immediate Seamless Dissolve into Portfolio
    // -------------------------------------------------------------
    if (elapsed >= this.duration) {
      this.isDone = true;
      this.onComplete();
      return;
    }

    introRafId = requestAnimationFrame(this.render);
  }
}

// Synthesize authentic cinematic sub-bass "Ta-dum" swell
function playCinematicTaDum() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(52, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, audioCtx.currentTime + 1.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 1.4);

    gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.7);
  } catch (e) {
    // Audio optional fallback
  }
}

// Controller for Setup and Seamless Transition
let introInstance = null;

function setupIntro() {
  if (!introCanvas || !introCtx || !introOverlay) {
    revealPortfolioImmediately();
    return;
  }

  introInstance = new NetflixCinematicIntro(introCanvas, introCtx, () => {
    revealPortfolioImmediately();
  });

  introInstance.start();

  function handleSkip() {
    if (introInstance) {
      introInstance.skip();
    }
  }

  introOverlay.addEventListener('click', handleSkip, { once: true });
  window.addEventListener('touchstart', handleSkip, { passive: true, once: true });
  window.addEventListener('keydown', handleSkip, { once: true });
  window.addEventListener('wheel', handleSkip, { passive: true, once: true });
}

function revealPortfolioImmediately() {
  if (!isIntroActive) return;
  isIntroActive = false;

  if (introOverlay) {
    introOverlay.classList.add('finished');
  }

  resizeCanvas();
  updateScrollProgress();
}

// ==========================================================================
// High-DPI Portfolio Scroll Animation Engine
// ==========================================================================
function resizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const activeIndex = Math.max(0, lastRenderedIndex);
  const currentImg = images[activeIndex] || images[0];
  if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
    renderFrame(currentImg);
  }
}

function renderFrame(img) {
  if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  ctx.clearRect(0, 0, cw, ch);

  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);
}

function getBestFrame(targetIndex) {
  if (images[targetIndex] && images[targetIndex].complete && images[targetIndex].naturalWidth > 0) {
    return images[targetIndex];
  }
  for (let offset = 1; offset < FRAME_COUNT; offset++) {
    const prev = targetIndex - offset;
    const next = targetIndex + offset;
    if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
      return images[prev];
    }
    if (next < FRAME_COUNT && images[next] && images[next].complete && images[next].naturalWidth > 0) {
      return images[next];
    }
  }
  return images[0] || null;
}

// ==========================================================================
// Whole-Page Scroll Engine
// ==========================================================================
function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll > 0) {
    targetProgress = window.scrollY / maxScroll;
  } else {
    targetProgress = 0;
  }
  targetProgress = Math.min(1, Math.max(0, targetProgress));

  if (navbar) {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
}

function animate() {
  currentProgress += (targetProgress - currentProgress) * 0.085;

  const frameIndex = Math.min(
    FRAME_COUNT - 1,
    Math.max(0, Math.round(currentProgress * (FRAME_COUNT - 1)))
  );

  if (frameIndex !== lastRenderedIndex) {
    const frameImg = getBestFrame(frameIndex);
    if (frameImg && frameImg.complete && frameImg.naturalWidth > 0) {
      renderFrame(frameImg);
      lastRenderedIndex = frameIndex;
    }
  }

  requestAnimationFrame(animate);
}

// ==========================================================================
// Concurrent Preloader (Loads during intro so portfolio is instantly ready)
// ==========================================================================
function preloadImages() {
  const firstImg = new Image();
  firstImg.src = FRAME_PATH(1);
  firstImg.onload = () => {
    images[0] = firstImg;
    loadedCount++;
    renderFrame(firstImg);
    lastRenderedIndex = 0;
  };
  images[0] = firstImg;

  for (let i = 2; i <= FRAME_COUNT; i++) {
    const img = new Image();
    img.src = FRAME_PATH(i);
    const index = i - 1;
    img.onload = () => {
      images[index] = img;
      loadedCount++;
    };
    images[index] = img;
  }
}

// ==========================================================================
// Dynamic ScrollSpy Navigation Engine
// ==========================================================================
function setupScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const sectionIds = ['home', 'about', 'experience', 'projects', 'contact'];
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (!navLinks.length || !sections.length) return;

  function setActive(activeId) {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${activeId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function updateActiveSection() {
    const scrollPos = window.scrollY;
    const viewportHeight = window.innerHeight;
    const scrollBottom = scrollPos + viewportHeight;
    const docHeight = document.documentElement.scrollHeight;

    // If near bottom of the document (within 120px), activate contact
    if (docHeight - scrollBottom < 120) {
      setActive('contact');
      return;
    }

    // Determine currently active section
    let currentId = 'home';
    const offset = 220; // Trigger threshold below top navbar

    sections.forEach(section => {
      const sectionTop = section.offsetTop - offset;
      if (scrollPos >= sectionTop) {
        currentId = section.getAttribute('id');
      }
    });

    setActive(currentId);
  }

  // Smooth scroll handler
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navId = targetId.replace('#', '');
        setActive(navId);
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('resize', updateActiveSection, { passive: true });
  updateActiveSection();
}

// Interactive Journey Stage Inspector
function setupLifecycleInspector() {
  const nodes = document.querySelectorAll('.journey-node');
  if (!nodes.length) return;

  nodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      nodes.forEach(n => {
        n.classList.remove('active');
        const tt = n.querySelector('.node-tooltip');
        if (tt) tt.remove();
      });
      node.classList.add('active');
      const desc = node.getAttribute('data-desc');
      if (desc) {
        const tooltip = document.createElement('div');
        tooltip.className = 'node-tooltip';
        tooltip.textContent = desc;
        node.appendChild(tooltip);
      }
    });

    node.addEventListener('mouseleave', () => {
      node.classList.remove('active');
      const tt = node.querySelector('.node-tooltip');
      if (tt) tt.remove();
    });
  });
}

// Animated Metric Counters
function setupMetricCounters() {
  const counters = document.querySelectorAll('.metric-big-num[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-target'));
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const pad = parseInt(el.getAttribute('data-pad') || '0', 10);
        const comma = el.getAttribute('data-comma') === 'true';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

        const duration = 1800;
        const startTime = performance.now();

        function updateCount(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Exponential ease-out
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const currentVal = ease * target;

          let formattedVal;
          if (decimals > 0) {
            formattedVal = currentVal.toFixed(decimals);
          } else {
            const intVal = Math.floor(currentVal);
            formattedVal = intVal.toString();
            if (pad > 0) formattedVal = formattedVal.padStart(pad, '0');
            if (comma) formattedVal = intVal.toLocaleString();
          }

          el.textContent = `${prefix}${formattedVal}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(updateCount);
          } else {
            let finalFormatted;
            if (decimals > 0) {
              finalFormatted = target.toFixed(decimals);
            } else {
              finalFormatted = target.toString();
              if (pad > 0) finalFormatted = finalFormatted.padStart(pad, '0');
              if (comma) finalFormatted = target.toLocaleString();
            }
            el.textContent = `${prefix}${finalFormatted}${suffix}`;
          }
        }

        requestAnimationFrame(updateCount);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.25 });

  counters.forEach(c => observer.observe(c));
}

// Window Listeners
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', () => {
  if (introInstance) introInstance.resize();
  resizeCanvas();
  updateScrollProgress();
});

// App Initialization
function init() {
  resizeCanvas();
  preloadImages();
  updateScrollProgress();
  requestAnimationFrame(animate);
  setupIntro();
  setupLifecycleInspector();
  setupMetricCounters();
  setupScrollSpy();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
