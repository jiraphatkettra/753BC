"use client";

import React, { useEffect, useRef } from "react";

/**
 * InteractiveDotGrid: Dense, Faint Technical Dot Matrix with Soft Illumination
 * 
 * Configured per user specification:
 * - Denser spacing (20px instead of 32px) matching the reference screenshot
 * - Faint subtle baseline dots (low opacity, delicate 0.8px radius)
 * - Mouse movement softly illuminates nearby dots (opacity increases up to ~0.30, not harsh)
 * - Zero bulging / scaling: dot radius strictly remains constant with no 3D magnification
 * - 0% idle CPU: pauses animation loop when motion settles
 */
export default function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationFrameId: number | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Grid configuration: Dense, faint, elegant
    const spacing = 20; // Denser matrix matching user reference image
    const baseRadius = 0.8; // Crisp, delicate dot size
    const baseAlpha = 0.065; // Very faint, subtle baseline dots
    const maxHoverAlpha = 0.30; // Soft illumination on hover (not too bright)

    let cols = 0;
    let rows = 0;
    let dotEnergy: Float32Array = new Float32Array(0);

    // Mouse coordinates and kinematics
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 130, // Proximity activation radius
      active: false,
    };

    // Expanding shockwaves on click (subtle light wave)
    interface Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
    }
    const ripples: Ripple[] = [];

    let isRunning = false;
    let idleTimeout: NodeJS.Timeout | null = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
      dotEnergy = new Float32Array(cols * rows);

      drawStatic();
    };

    // Draw static matrix when completely idle
    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha})`;
      ctx.beginPath();

      for (let c = 0; c < cols; c++) {
        const x = c * spacing;
        for (let r = 0; r < rows; r++) {
          const y = r * spacing;
          ctx.moveTo(x + baseRadius, y);
          ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };

    // Main render loop
    const render = () => {
      // 1. Lerp mouse position for smooth trailing response
      const dx = mouse.targetX - mouse.x;
      const dy = mouse.targetY - mouse.y;
      mouse.x += dx * 0.25;
      mouse.y += dy * 0.25;

      ctx.clearRect(0, 0, width, height);

      // 2. Draw very subtle monochromatic ambient glow behind cursor
      if (mouse.active && mouse.x > -400) {
        const ambientGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 1.1
        );
        ambientGlow.addColorStop(0, "rgba(255, 255, 255, 0.022)");
        ambientGlow.addColorStop(0.6, "rgba(255, 255, 255, 0.006)");
        ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = ambientGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Update ripples from clicks
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += 6;
        rip.alpha *= 0.93;

        if (rip.alpha < 0.015 || rip.radius > rip.maxRadius) {
          ripples.splice(i, 1);
        }
      }

      // 4. Excite dots based on mouse proximity & active ripples
      let maxEnergyRemaining = 0;

      for (let c = 0; c < cols; c++) {
        const x = c * spacing;
        for (let r = 0; r < rows; r++) {
          const y = r * spacing;
          const idx = c * rows + r;

          // Mouse excitation
          if (mouse.active && mouse.x > -400) {
            const distSq = (x - mouse.x) ** 2 + (y - mouse.y) ** 2;
            const rSq = mouse.radius ** 2;

            if (distSq < rSq) {
              const dist = Math.sqrt(distSq);
              const factor = 1 - dist / mouse.radius;
              const intensity = factor * factor; // Quadratic falloff

              // Charge up dot energy
              if (intensity > dotEnergy[idx]) {
                dotEnergy[idx] = intensity;
              }
            }
          }

          // Ripple excitation
          for (let ripIdx = 0; ripIdx < ripples.length; ripIdx++) {
            const rip = ripples[ripIdx];
            const dist = Math.hypot(x - rip.x, y - rip.y);
            const waveDiff = Math.abs(dist - rip.radius);

            if (waveDiff < 20) {
              const wavePower = (1 - waveDiff / 20) * rip.alpha;
              if (wavePower > dotEnergy[idx]) {
                dotEnergy[idx] = wavePower;
              }
            }
          }

          // Exponential decay for soft light trail
          dotEnergy[idx] *= 0.92;
          if (dotEnergy[idx] < 0.005) {
            dotEnergy[idx] = 0;
          }

          if (dotEnergy[idx] > maxEnergyRemaining) {
            maxEnergyRemaining = dotEnergy[idx];
          }
        }
      }

      // 5. Render dots in two passes: base static dots and illuminated dots
      // Pass A: Distant base dots in single continuous GPU path
      ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha})`;
      ctx.beginPath();

      const activeDots: {
        x: number;
        y: number;
        alpha: number;
      }[] = [];

      for (let c = 0; c < cols; c++) {
        const x = c * spacing;
        for (let r = 0; r < rows; r++) {
          const y = r * spacing;
          const energy = dotEnergy[c * rows + r];

          if (energy > 0.01) {
            const dotAlpha = baseAlpha + energy * (maxHoverAlpha - baseAlpha);
            activeDots.push({ x, y, alpha: dotAlpha });
          } else {
            ctx.moveTo(x + baseRadius, y);
            ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
          }
        }
      }
      ctx.fill();

      // Pass B: Illuminated dots
      // STRICT REQUIREMENT: No bulging / enlargement — radius stays exactly at baseRadius
      for (let i = 0; i < activeDots.length; i++) {
        const dot = activeDots[i];
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.alpha})`;
        ctx.fill();
      }

      // Check if animation should continue or pause
      const isMouseMoving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;
      const hasRipples = ripples.length > 0;
      const hasTrail = maxEnergyRemaining > 0.01;

      if (mouse.active || isMouseMoving || hasRipples || hasTrail) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        isRunning = false;
        drawStatic();
      }
    };

    const startAnimation = () => {
      if (!isRunning && !prefersReducedMotion) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;

      startAnimation();

      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        mouse.active = false;
      }, 1800);
    };

    const handleClick = (e: MouseEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 220,
        alpha: 0.35,
      });
      startAnimation();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
        startAnimation();

        if (idleTimeout) clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
          mouse.active = false;
        }, 1200);
      }
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      mouse.active = false;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("click", handleClick);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    resize();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (idleTimeout) clearTimeout(idleTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070809]"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
}
