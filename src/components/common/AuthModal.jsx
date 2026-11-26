import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Mail, Sparkles, User, X } from 'lucide-react';
import MagneticButton from './MagneticButton';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    const usersRaw = localStorage.getItem('nexpdf_users');
    const users = usersRaw ? JSON.parse(usersRaw) : [];

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setError('An account with this email already exists. Please sign in.');
        return;
      }
      const newUser = { name: name.trim(), email: email.trim(), password, plan: 'Pro Workspace' };
      users.push(newUser);
      localStorage.setItem('nexpdf_users', JSON.stringify(users));
      localStorage.setItem('nexpdf_session', JSON.stringify({ name: newUser.name, email: newUser.email, plan: newUser.plan }));
      onAuthSuccess({ name: newUser.name, email: newUser.email, plan: newUser.plan });
      onClose();
    } else {
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found && found.password !== password) {
        setError('Incorrect password for this account.');
        return;
      }
      const userObj = found
        ? { name: found.name, email: found.email, plan: found.plan }
        : { name: email.split('@')[0], email: email.trim(), plan: 'Pro Workspace' };
      localStorage.setItem('nexpdf_session', JSON.stringify(userObj));
      onAuthSuccess(userObj);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card glow-border rounded-2xl w-full max-w-md p-6 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            NexPDF Cloud-Free Account
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your studio ID'}
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Local profile stored securely in your browser. Zero server uploads.
          </p>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/85 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.dev"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/85 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/85 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <MagneticButton type="submit" className="w-full py-2.5 text-sm mt-2">
              {mode === 'login' ? 'Sign In to NexPDF' : 'Create Studio Account'}
            </MagneticButton>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
