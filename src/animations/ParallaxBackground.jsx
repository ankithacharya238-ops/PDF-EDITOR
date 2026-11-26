import React, { useEffect, useState } from 'react';

/**
 * Multi-layer parallax backdrop combining mouse-reactive ambient gradient orbs,
 * scroll-reactive depth grid, and floating geometric glass accents.
 */
export default function ParallaxBackground({ subtle = false }) {
  const [offset, setOffset] = useState({ x: 0, y: 0, scrollY: 0 });

  useEffect(() => {
    let raf = null;
    let nextX = 0;
    let nextY = 0;

    const handleMove = (e) => {
      nextX = (e.clientX / window.innerWidth - 0.5) * 2;
      nextY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          setOffset((prev) => ({ ...prev, x: nextX, y: nextY }));
          raf = null;
        });
      }
    };

    const handleScroll = () => {
      setOffset((prev) => ({ ...prev, scrollY: window.scrollY }));
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('scroll', handleScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const factor = subtle ? 0.35 : 1;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {/* Layer 1: Deep Space Radial Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99, 102, 241, 0.22), transparent 70%), radial-gradient(ellipse 65% 55% at 85% 30%, rgba(6, 182, 212, 0.14), transparent 70%), #050711',
        }}
      />

      {/* Layer 2: Cyber Perspective Grid with slow scroll parallax */}
      <div
        className="absolute -inset-12 cyber-grid opacity-75 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${offset.x * -14 * factor}px, ${(offset.y * -14 - offset.scrollY * 0.08) * factor}px, 0)`,
        }}
      />

      {/* Layer 3: Glowing Electric Gradient Orbs */}
      <div
        className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full blur-[130px] opacity-35 transition-transform duration-500 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.75) 0%, rgba(59,130,246,0.18) 60%, transparent 100%)',
          transform: `translate3d(${offset.x * 36 * factor}px, ${(offset.y * 28 - offset.scrollY * 0.12) * factor}px, 0)`,
        }}
      />

      <div
        className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full blur-[140px] opacity-30 transition-transform duration-500 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.75) 0%, rgba(99,102,241,0.18) 65%, transparent 100%)',
          transform: `translate3d(${offset.x * -42 * factor}px, ${(offset.y * -30 - offset.scrollY * 0.18) * factor}px, 0)`,
        }}
      />

      {!subtle && (
        <>
          {/* Layer 4: Floating Geometric Wireframe Rings */}
          <div
            className="hidden md:block absolute top-[22%] left-[8%] w-24 h-24 rounded-2xl border border-violet-400/20 bg-violet-500/5 backdrop-blur-sm rotate-12 transition-transform duration-300 ease-out"
            style={{
              transform: `translate3d(${offset.x * 24}px, ${offset.y * 20 - offset.scrollY * 0.22}px, 0) rotate(${12 + offset.x * 8}deg)`,
            }}
          />
          <div
            className="hidden md:block absolute top-[62%] right-[9%] w-32 h-32 rounded-full border border-cyan-400/20 bg-cyan-500/5 backdrop-blur-sm transition-transform duration-300 ease-out"
            style={{
              transform: `translate3d(${offset.x * -30}px, ${offset.y * -24 - offset.scrollY * 0.28}px, 0)`,
            }}
          />
        </>
      )}
    </div>
  );
}
