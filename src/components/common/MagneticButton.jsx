import React from 'react';

export default function MagneticButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled = false,
  title,
  ...rest
}) {
  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none overflow-hidden group';

  const variants = {
    primary:
      'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_26px_rgba(139,92,246,0.4)] hover:shadow-[0_0_36px_rgba(34,211,238,0.5)] border border-white/15',
    secondary:
      'glass-panel text-slate-100 hover:border-cyan-400/50 hover:bg-white/10',
    ghost:
      'text-slate-300 hover:text-white hover:bg-white/10',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-magnetic
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transform transition-transform duration-700"
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
