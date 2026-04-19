'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function hashString(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function sampleGradient(rgbs: RGB[], t: number): RGB {
  const ct = Math.max(0, Math.min(1, t));
  const seg = ct * (rgbs.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  const c1 = rgbs[Math.min(i, rgbs.length - 1)]!;
  const c2 = rgbs[Math.min(i + 1, rgbs.length - 1)]!;
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * f),
    Math.round(c1[1] + (c2[1] - c1[1]) * f),
    Math.round(c1[2] + (c2[2] - c1[2]) * f),
  ];
}

interface Point3D { x: number; y: number; z: number }
type AttractorFn = (p: Point3D, dt: number, params: readonly number[]) => Point3D;

const lorenz: AttractorFn = (p, dt, params) => {
  const sigma = params[0]!;
  const rho = params[1]!;
  const beta = params[2]!;
  return {
    x: p.x + sigma * (p.y - p.x) * dt,
    y: p.y + (p.x * (rho - p.z) - p.y) * dt,
    z: p.z + (p.x * p.y - beta * p.z) * dt,
  };
};

const rossler: AttractorFn = (p, dt, params) => {
  const a = params[0]!;
  const b = params[1]!;
  const c = params[2]!;
  return {
    x: p.x + (-p.y - p.z) * dt,
    y: p.y + (p.x + a * p.y) * dt,
    z: p.z + (b + p.z * (p.x - c)) * dt,
  };
};

const aizawa: AttractorFn = (p, dt, params) => {
  const a = params[0]!;
  const b = params[1]!;
  const c = params[2]!;
  const d = params[3]!;
  const e = params[4]!;
  const f = params[5]!;
  return {
    x: p.x + ((p.z - b) * p.x - d * p.y) * dt,
    y: p.y + (d * p.x + (p.z - b) * p.y) * dt,
    z: p.z + (c + a * p.z - p.z ** 3 / 3 - (p.x ** 2 + p.y ** 2) * (1 + e * p.z) + f * p.z * p.x ** 3) * dt,
  };
};

const thomas: AttractorFn = (p, dt, params) => {
  const b = params[0]!;
  return {
    x: p.x + (Math.sin(p.y) - b * p.x) * dt,
    y: p.y + (Math.sin(p.z) - b * p.y) * dt,
    z: p.z + (Math.sin(p.x) - b * p.z) * dt,
  };
};

const halvorsen: AttractorFn = (p, dt, params) => {
  const a = params[0]!;
  return {
    x: p.x + (-a * p.x - 4 * p.y - 4 * p.z - p.y ** 2) * dt,
    y: p.y + (-a * p.y - 4 * p.z - 4 * p.x - p.z ** 2) * dt,
    z: p.z + (-a * p.z - 4 * p.x - 4 * p.y - p.x ** 2) * dt,
  };
};

const ATTRACTORS = [
  { fn: lorenz, params: [10, 28, 8 / 3], init: { x: 0.1, y: 0, z: 0 }, dt: 0.005, scale: 6 },
  { fn: rossler, params: [0.2, 0.2, 5.7], init: { x: 0.1, y: 0, z: 0 }, dt: 0.02, scale: 3.5 },
  { fn: aizawa, params: [0.95, 0.7, 0.6, 3.5, 0.25, 0.1], init: { x: 0.1, y: 0, z: 0 }, dt: 0.01, scale: 2.8 },
  { fn: thomas, params: [0.208186], init: { x: 1, y: 0, z: 0 }, dt: 0.05, scale: 1.5 },
  { fn: halvorsen, params: [1.89], init: { x: -1.48, y: -1.51, z: 2.04 }, dt: 0.003, scale: 1.8 },
];

const PALETTES = [
  // paper + accent green (merged primary) — inverted for light background
  { bg: '#f7f6f1', colors: ['#f7f6f1', '#d9faea', '#b7f5dc', '#7af0c1', '#34e3a1', '#00d488', '#00a76e', '#008a5e', '#115555', '#143240', '#111a23', '#0b0f17'] },
  // paper + deep teal
  { bg: '#f7f6f1', colors: ['#f3fbf9', '#e0f7f4', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#1e9ba5', '#146a7b', '#0f3f5e', '#0e2d40', '#0b1a2a', '#06101c'] },
  // paper + amber (warm)
  { bg: '#f7f6f1', colors: ['#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#a86310', '#6b3205', '#3a1f07', '#1a110a', '#0b0f17'] },
  // paper + violet
  { bg: '#f7f6f1', colors: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a78bfa', '#7c3aed', '#5b21b6', '#341a80', '#20174f', '#15142e', '#0a0a1a'] },
  // paper + coral
  { bg: '#f7f6f1', colors: ['#fff3e3', '#ffe9d3', '#ffd8b3', '#ffbe88', '#ff9a76', '#ff6b6b', '#e74c3c', '#b83030', '#7a1a1a', '#4a0e0e', '#260a0a', '#140606'] },
];

const PALETTE_RGBS = PALETTES.map((p) => p.colors.map(hexToRgb));

function projectToArrays(
  points: Float32Array,
  count: number,
  out: Float32Array,
  w: number,
  h: number,
  scale: number,
  rotY: number,
  rotX: number
): { minD: number; maxD: number } {
  const cosY = Math.cos(rotY),
    sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX),
    sinX = Math.sin(rotX);
  const fov = 300;
  const hw = w / 2,
    hh = h / 2;
  let minD = Infinity,
    maxD = -Infinity;

  for (let i = 0; i < count; i++) {
    const off = i * 4;
    const px = points[off]!;
    const py = points[off + 1]!;
    const pz = points[off + 2]!;
    const rx = px * cosY - pz * sinY;
    const rz = px * sinY + pz * cosY;
    const ry = py * cosX - rz * sinX;
    const depth = py * sinX + rz * cosX;

    const d = depth * scale + fov;
    const ps = fov / (d > 50 ? d : 50);

    out[off] = hw + rx * scale * ps;
    out[off + 1] = hh + ry * scale * ps;
    out[off + 2] = d;
    out[off + 3] = points[off + 3]!;

    if (d < minD) minD = d;
    if (d > maxD) maxD = d;
  }

  return { minD, maxD };
}

function generatePoints(seed: string) {
  const rand = seededRandom(hashString(seed));
  const attractorIdx = Math.floor(rand() * ATTRACTORS.length);
  const paletteIdx = Math.floor(rand() * PALETTES.length);
  const attractor = ATTRACTORS[attractorIdx]!;
  const palette = PALETTES[paletteIdx]!;
  const rgbs = PALETTE_RGBS[paletteIdx]!;
  const baseRotY = rand() * Math.PI * 2;
  const baseRotX = rand() * 0.6 - 0.3;

  const ITERATIONS = 45000;
  let p = { ...attractor.init };
  for (let i = 0; i < 500; i++) p = attractor.fn(p, attractor.dt, attractor.params);

  const points = new Float32Array(ITERATIONS * 4);
  for (let i = 0; i < ITERATIONS; i++) {
    p = attractor.fn(p, attractor.dt, attractor.params);
    const off = i * 4;
    points[off] = p.x;
    points[off + 1] = p.y;
    points[off + 2] = p.z;
    points[off + 3] = i / ITERATIONS;
  }

  const testSc = attractor.scale * 20;
  const projected = new Float32Array(ITERATIONS * 4);
  projectToArrays(points, ITERATIONS, projected, 1920, 960, testSc, baseRotY, baseRotX);

  let pxMinX = Infinity,
    pxMaxX = -Infinity,
    pxMinY = Infinity,
    pxMaxY = -Infinity;
  for (let i = 0; i < ITERATIONS; i++) {
    const off = i * 4;
    const sx = projected[off]!;
    const sy = projected[off + 1]!;
    if (sx < pxMinX) pxMinX = sx;
    if (sx > pxMaxX) pxMaxX = sx;
    if (sy < pxMinY) pxMinY = sy;
    if (sy > pxMaxY) pxMaxY = sy;
  }
  const pxWidth = pxMaxX - pxMinX || 1;
  const pxHeight = pxMaxY - pxMinY || 1;
  const targetFill = 2.46;
  const fitScaleX = (1920 * targetFill) / pxWidth;
  const fitScaleY = (960 * targetFill) / pxHeight;
  const autoScale = Math.min(fitScaleX, fitScaleY) * testSc;

  return { points, count: ITERATIONS, palette, rgbs, baseRotY, baseRotX, autoScale };
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: ReturnType<typeof generatePoints>,
  rotDelta: number,
  animPhase: number,
  brightness: number,
  projected: Float32Array,
  sortIndices: Uint32Array
) {
  const { points, count, palette, rgbs, baseRotY, baseRotX, autoScale } = data;
  const rotY = baseRotY + rotDelta;
  const rotX = baseRotX + rotDelta * 0.3;

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);

  const { minD, maxD } = projectToArrays(points, count, projected, w, h, autoScale, rotY, rotX);
  const zRange = maxD - minD || 1;

  // Radix-ish depth bucket sort
  const BUCKETS = 256;
  const bucketCounts = new Uint32Array(BUCKETS);
  const depthKeys = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const key = Math.min(255, ((projected[i * 4 + 2]! - minD) / zRange * 255) | 0);
    depthKeys[i] = key;
    bucketCounts[key]!++;
  }
  const offsets = new Uint32Array(BUCKETS);
  for (let i = 1; i < BUCKETS; i++) offsets[i] = offsets[i - 1]! + bucketCounts[i - 1]!;
  for (let i = 0; i < count; i++) {
    const bucket = depthKeys[i]!;
    sortIndices[offsets[bucket]!++] = i;
  }

  for (let si = 0; si < count; si++) {
    const idx = sortIndices[si]!;
    const off = idx * 4;
    const px = projected[off]!;
    const py = projected[off + 1]!;
    const pz = projected[off + 2]!;
    const t = projected[off + 3]!;
    const zn = (pz - minD) / zRange;

    const colorT = (zn * 0.4 + t * 0.4 + animPhase * 0.8) % 1.0;
    const [r, g, b] = sampleGradient(rgbs, colorT);

    const size = 0.25 + zn * 1.2 + brightness * zn * 0.5;
    const alpha = Math.min(1, 0.08 + zn * 0.48 + brightness * 0.32);

    if (zn > 0.6 && brightness > 0.2) {
      const gr = size * (2.5 + brightness * 2);
      ctx.beginPath();
      ctx.arc(px, py, gr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.05 * brightness})`;
      ctx.fill();
    }

    if (size < 1.2) {
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(px - size, py - size, size * 2, size * 2);
    } else {
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }
  }

  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, w * 0.75);
  vig.addColorStop(0, 'rgba(247,246,241,0)');
  vig.addColorStop(0.7, 'rgba(247,246,241,0.18)');
  vig.addColorStop(1, 'rgba(247,246,241,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  const bf = ctx.createLinearGradient(0, h * 0.45, 0, h);
  bf.addColorStop(0, 'rgba(247,246,241,0)');
  bf.addColorStop(1, 'rgba(247,246,241,0.45)');
  ctx.fillStyle = bf;
  ctx.fillRect(0, 0, w, h);
}

const staticCache = new Map<string, ImageBitmap>();

interface AttractorBannerProps {
  seed: string;
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}

export default function AttractorBanner({
  seed,
  width = 1600,
  height = 800,
  className,
  animate = false,
}: AttractorBannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<ReturnType<typeof generatePoints> | null>(null);
  const animRef = useRef<number>(0);
  const animatingRef = useRef(false);
  const projectedRef = useRef<Float32Array | null>(null);
  const sortIndicesRef = useRef<Uint32Array | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const renderedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setIsVisible(true);
      },
      { rootMargin: '200px' }
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const render = useCallback(
    (rotDelta: number, animPhase: number, brightness: number) => {
      const canvas = canvasRef.current;
      const data = dataRef.current;
      if (!canvas || !data) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = width * dpr;
      const ch = height * dpr;
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!projectedRef.current || projectedRef.current.length !== data.count * 4) {
        projectedRef.current = new Float32Array(data.count * 4);
        sortIndicesRef.current = new Uint32Array(data.count);
      }

      drawFrame(
        ctx,
        width,
        height,
        data,
        rotDelta,
        animPhase,
        brightness,
        projectedRef.current!,
        sortIndicesRef.current!
      );
    },
    [width, height]
  );

  const renderStatic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const cached = staticCache.get(seed);
    if (cached) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(cached, 0, 0);
      return;
    }

    dataRef.current = generatePoints(seed);
    render(0, 0, 0.05);
    if (typeof createImageBitmap !== 'undefined') {
      createImageBitmap(canvas).then((bmp) => staticCache.set(seed, bmp)).catch(() => {});
    }
  }, [seed, width, height, render]);

  const startAnimation = useCallback(() => {
    if (animatingRef.current) return;
    if (!dataRef.current) dataRef.current = generatePoints(seed);
    animatingRef.current = true;

    const duration = 2200;
    const start = performance.now();
    const maxRot = Math.PI * 0.083;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease =
        progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      const rotDelta = Math.sin(ease * Math.PI) * maxRot;
      const animPhase = ease * 0.7;
      const brightness = Math.sin(progress * Math.PI) * 0.85;

      render(rotDelta, animPhase, 0.05 + brightness);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        render(0, 0.7, 0.05);
        animatingRef.current = false;
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, [render, seed]);

  useEffect(() => {
    if (!isVisible || renderedRef.current) return;
    renderedRef.current = true;
    renderStatic();
    if (animate) startAnimation();
  }, [isVisible, renderStatic, animate, startAnimation]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseEnter={startAnimation}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      aria-hidden
    />
  );
}
