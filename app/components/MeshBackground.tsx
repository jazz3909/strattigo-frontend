'use client';
import { useEffect, useRef } from 'react';

interface ColorPoint {
  x: number;
  y: number;
  color: string;
  radius: number;
  opacity: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const COLOR_POINTS: ColorPoint[] = [
  // Top-left — deep navy anchors the corner
  { x: 0.0,  y: 0.0,  color: '#1A2D45', radius: 1.0,  opacity: 0.95 },
  // Top-center — rich ocean blue
  { x: 0.4,  y: 0.0,  color: '#2A5F8D', radius: 0.85, opacity: 0.85 },
  // Top-right — starts pulling into purple
  { x: 1.0,  y: 0.0,  color: '#4A3A6B', radius: 0.80, opacity: 0.80 },
  // Mid-left — dark teal keeps left side rich
  { x: 0.0,  y: 0.45, color: '#1E3A5A', radius: 0.80, opacity: 0.80 },
  // Dead center — mauve bridge between blue and warm
  { x: 0.5,  y: 0.45, color: '#5C3B6B', radius: 0.75, opacity: 0.75 },
  // Mid-right — purple-mauve
  { x: 1.0,  y: 0.4,  color: '#7B4A6B', radius: 0.80, opacity: 0.80 },
  // Bottom-left — deep navy so left stays dark and rich, not black
  { x: 0.0,  y: 1.0,  color: '#1F3550', radius: 0.90, opacity: 0.90 },
  // Bottom-center-left — mauve warming up
  { x: 0.35, y: 0.85, color: '#7B4A6B', radius: 0.75, opacity: 0.75 },
  // Bottom-center — transition into warm
  { x: 0.6,  y: 0.75, color: '#9A5060', radius: 0.75, opacity: 0.80 },
  // Bottom-right — full terracotta/salmon
  { x: 1.0,  y: 0.85, color: '#B05857', radius: 0.90, opacity: 0.90 },
  // Far bottom-right corner lock
  { x: 1.0,  y: 1.0,  color: '#C06050', radius: 0.85, opacity: 0.85 },
  // Extra center-bottom warmth to avoid cold gap
  { x: 0.5,  y: 1.0,  color: '#8A4A60', radius: 0.70, opacity: 0.70 },
];

function drawMesh(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const w = canvas.width;
  const h = canvas.height;
  const maxDim = Math.max(w, h);

  // Base fill
  ctx.fillStyle = '#0D1420';
  ctx.fillRect(0, 0, w, h);

  // Layer each color point as a radial gradient blob
  COLOR_POINTS.forEach(({ x, y, color, radius, opacity }) => {
    const cx = x * w;
    const cy = y * h;
    const r = radius * maxDim;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0,   hexToRgba(color, opacity));
    grad.addColorStop(0.4, hexToRgba(color, opacity * 0.6));
    grad.addColorStop(0.7, hexToRgba(color, opacity * 0.2));
    grad.addColorStop(1,   hexToRgba(color, 0));

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

  // Final soft vignette to ground the edges
  const vignette = ctx.createRadialGradient(
    w * 0.5, h * 0.5, 0,
    w * 0.5, h * 0.5, maxDim * 0.85
  );
  vignette.addColorStop(0,   'rgba(0,0,0,0)');
  vignette.addColorStop(0.7, 'rgba(0,0,0,0)');
  vignette.addColorStop(1,   'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

export function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

    function render(): void {
      drawMesh(canvas!, ctx!);
    }

    function resize(): void {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
