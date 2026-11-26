import React, { useRef, useState } from 'react';

/**
 * 3D Perspective Tilt Card with dynamic cursor-tracked radial glow border.
 */
export default function TiltCard3D({ children, className = '' }) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
    glowX: 50,
    glowY: 50,
    hovered: false,
  });

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 14;
    const rotateX = (0.5 - y) * 14;
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02,1.02,1.02)`,
      glowX: x * 100,
      glowY: y * 100,
      hovered: true,
    });
  };

  const handleLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
      glowX: 50,
      glowY: 50,
      hovered: false,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transform: style.transform }}
      className={`relative rounded-2xl transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {/* Dynamic spotlight border glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: style.hovered ? 1 : 0,
          background: `radial-gradient(360px circle at ${style.glowX}% ${style.glowY}%, rgba(56, 189, 248, 0.22), rgba(139, 92, 246, 0.12) 45%, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
