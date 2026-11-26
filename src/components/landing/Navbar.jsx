import React from 'react';
import { LogOut, Sparkles, User } from 'lucide-react';
import Logo from '../common/Logo';
import MagneticButton from '../common/MagneticButton';

export default function Navbar({
  user,
  onOpenAuth,
  onSignOut,
  onStartEditing,
  cursorFxEnabled,
  onToggleCursorFx,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050711]/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <a href="#home" className="focus:outline-none">
          <Logo />
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <a href="#home" className="hover:text-cyan-300 transition-colors">
            Home
          </a>
          <a href="#upload" className="hover:text-cyan-300 transition-colors">
            Upload
          </a>
          <a href="#features" className="hover:text-cyan-300 transition-colors">
            Features
          </a>
          <a href="#about" className="hover:text-cyan-300 transition-colors">
            About
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleCursorFx}
            title="Toggle custom glowing cursor effects"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
              cursorFxEnabled
                ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Cursor FX
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel text-xs">
                <User className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-slate-100 font-medium">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                title="Sign out"
                className="p-2 rounded-xl border border-white/10 text-slate-300 hover:text-rose-300 hover:border-rose-400/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border border-violet-400/40 text-violet-200 hover:bg-violet-500/15 transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}

          <MagneticButton onClick={onStartEditing} className="px-4 py-2 text-xs sm:text-sm">
            Start Editing
          </MagneticButton>
        </div>
      </div>
    </header>
  );
}
