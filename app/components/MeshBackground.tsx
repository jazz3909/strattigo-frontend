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
  // Top-center — rich ocean blue, strong and bleeding into middle
  { x: 0.4,  y: 0.1,  color: '#2A5F8D', radius: 0.90, opacity: 0.90 },
  // Top-right — starts pulling into purple
  { x: 1.0,  y: 0.0,  color: '#4A3A6B', radius: 0.75, opacity: 0.75 },
  // Mid-left — dark teal, large radius to hold left half
  { x: 0.0,  y: 0.5,  color: '#1E3A5A', radius: 0.95, opacity: 0.90 },
  // Center-right band bridge — mid-value blue-mauve so the gap between the left cool
  // mass and the right warm mass is filled by a real core, not faint overlapping tails.
  { x: 0.6,  y: 0.65, color: '#3A4A6B', radius: 0.7,  opacity: 0.6 },
  // Center-right — mauve, radius widened to fill the band instead of clustering right
  { x: 0.70, y: 0.45, color: '#5C3B6B', radius: 0.85, opacity: 0.80 },
  // Mid-right — purple-mauve, widened to carry color across the right 40%
  { x: 1.0,  y: 0.4,  color: '#7B4A6B', radius: 0.95, opacity: 0.85 },
  // Bottom-left — strong navy anchor, prevents warm bleed
  { x: 0.0,  y: 1.0,  color: '#1F3550', radius: 1.0,  opacity: 0.95 },
  // Bottom-right area — mauve transition, widened to fill lower-right band
  { x: 0.75, y: 0.85, color: '#7B4A6B', radius: 0.80, opacity: 0.78 },
  // Bottom-right — warm transition, widened so it no longer reads as confined
  { x: 0.85, y: 0.80, color: '#9A5060', radius: 0.70, opacity: 0.80 },
  // Bottom-right corner — terracotta, radius widened (opacity kept)
  { x: 1.0,  y: 0.88, color: '#B05857', radius: 0.80, opacity: 0.85 },
  // Far bottom-right corner lock, widened radius
  { x: 1.0,  y: 1.0,  color: '#C06050', radius: 0.75, opacity: 0.80 },
  // Bottom-right warm accent, widened
  { x: 0.85, y: 1.0,  color: '#8A4A60', radius: 0.70, opacity: 0.72 },
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
