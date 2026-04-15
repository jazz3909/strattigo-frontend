'use client';
import { useEffect, useRef } from 'react';

export function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const c = canvas;
    const context = ctx;

    function hexToRgba(hex: string, alpha: number): string {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function draw(): void {
      const w = c.width;
      const h = c.height;

      context.fillStyle = '#0D1420';
      context.fillRect(0, 0, w, h);

      const points: [number, number, string, number][] = [
        [0,   0,   '#1A2D45', 0.9],
        [0.5, 0,   '#2A5F8D', 0.7],
        [1,   0,   '#4A3A6B', 0.7],
        [0,   0.5, '#1E3A5A', 0.7],
        [0.5, 0.4, '#5C3B6B', 0.6],
        [1,   0.4, '#7B4A6B', 0.7],
        [0,   1,   '#1A2D45', 0.8],
        [0.4, 0.8, '#7B4A6B', 0.7],
        [0.7, 0.7, '#9A5060', 0.7],
        [1,   0.8, '#B05857', 0.8],
        [1,   1,   '#B05857', 0.9],
      ];

      points.forEach(([px, py, color, radius]) => {
        const x = px * w;
        const y = py * h;
        const r = radius * Math.max(w, h);
        const grad = context.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, hexToRgba(color, 0.85));
        grad.addColorStop(1, hexToRgba(color, 0));
        context.fillStyle = grad;
        context.fillRect(0, 0, w, h);
      });
    }

    function resize(): void {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      draw();
    }

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
