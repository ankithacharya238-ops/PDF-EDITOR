import React, { useEffect, useRef, useState } from 'react';

/**
 * Custom animated cursor with glowing dot, spring-lerped trailing ring,
 * magnetic button pull/expansion, and click ripple effects.
 * Automatically pauses over the interactive PDF canvas so editing precision is never obstructed.
 */
export default function CustomCursor({ enabled = true }) {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hoverState, setHoverState] = useState('default'); // 'default' | 'pointer' | 'canvas'
  const [ripples, setRipples] = useState([]);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const magneticOffset = useRef({ x: 0, y: 0, activeEl: null });

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!enabled || isTouch) {
      document.body.classList.remove('custom-cursor-enabled');
      return;
    }

    document.body.classList.add('custom-cursor-enabled');

    let rafId;
    const animate = () => {
      const targetX = mousePos.current.x + magneticOffset.current.x;
      const targetY = mousePos.current.y + magneticOffset.current.y;

      ringPos.current.x += (targetX - ringPos.current.x) * 0.16;
      ringPos.current.y += (targetY - ringPos.current.y) * 0.16;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      const target = e.target;
      if (target?.closest?.('.pdf-interactive-surface')) {
        setHoverState('canvas');
        if (magneticOffset.current.activeEl) {
          magneticOffset.current.activeEl.style.transform = '';
          magneticOffset.current = { x: 0, y: 0, activeEl: null };
        }
        return;
      }

      const interactiveEl = target?.closest?.('button, a, [data-magnetic], [role="button"], input[type="range"]');
      if (interactiveEl) {
        setHoverState('pointer');
        if (interactiveEl.hasAttribute('data-magnetic')) {
          const rect = interactiveEl.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) * 0.2;
          const dy = (e.clientY - cy) * 0.2;
          interactiveEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
          magneticOffset.current = { x: (cx - e.clientX) * 0.15, y: (cy - e.clientY) * 0.15, activeEl: interactiveEl };
        }
      } else {
        setHoverState('default');
        if (magneticOffset.current.activeEl) {
          magneticOffset.current.activeEl.style.transform = '';
          magneticOffset.current = { x: 0, y: 0, activeEl: null };
        }
      }
    };

    const handleMouseDown = (e) => {
      if (e.target?.closest?.('.pdf-interactive-surface')) return;
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };

    const handleMouseLeave = () => setVisible(false);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      document.body.classList.remove('custom-cursor-enabled');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (magneticOffset.current.activeEl) {
        magneticOffset.current.activeEl.style.transform = '';
      }
    };
  }, [enabled, visible]);

  if (!enabled) return null;

  const isHidden = !visible || hoverState === 'canvas';
  const isPointer = hoverState === 'pointer';

  return (
    <>
      {/* Trailing Ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-[9998] rounded-full transition-[width,height,border-color,background-color,opacity] duration-200 ease-out ${
          isHidden ? 'opacity-0' : 'opacity-100'
        } ${
          isPointer
            ? 'w-11 h-11 border border-cyan-400/80 bg-violet-500/15 shadow-[0_0_24px_rgba(34,211,238,0.4)]'
            : 'w-8 h-8 border border-violet-400/50 bg-transparent shadow-[0_0_16px_rgba(139,92,246,0.22)]'
        }`}
      />

      {/* Glowing Core Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-[9999] rounded-full transition-[width,height,opacity,background] duration-150 ${
          isHidden ? 'opacity-0' : 'opacity-100'
        } ${
          isPointer
            ? 'w-2.5 h-2.5 bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.95)]'
            : 'w-1.5 h-1.5 bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.9)]'
        }`}
      />

      {/* Click Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          style={{ left: r.x, top: r.y }}
          className="cursor-ripple pointer-events-none fixed z-[9997] w-7 h-7 rounded-full border border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
        />
      ))}
    </>
  );
}
