import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Eraser, PenTool, Type, Upload, X } from 'lucide-react';
import MagneticButton from '../common/MagneticButton';

const INK_COLORS = ['#0f172a', '#1d4ed8', '#6d28d9', '#dc2626'];
const SCRIPT_STYLES = [
  { id: 'caveat', label: 'Executive Script', font: '600 54px "Caveat", cursive' },
  { id: 'playfair', label: 'Classic Editorial', font: 'italic 500 44px "Playfair Display", Georgia, serif' },
  { id: 'sans', label: 'Modern Clean', font: '600 40px "Plus Jakarta Sans", sans-serif' },
];

export default function SignatureModal({ isOpen, onClose, onInsertSignature }) {
  const [tab, setTab] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [inkColor, setInkColor] = useState('#0f172a');
  const [typedText, setTypedText] = useState('Alex Mercer');
  const [scriptIdx, setScriptIdx] = useState(0);
  const [savedSigs, setSavedSigs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexpdf_signatures') || '[]');
    } catch {
      return [];
    }
  });

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);

  useEffect(() => {
    if (!isOpen || tab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokeRef.current = false;
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e) => {
    drawingRef.current = true;
    hasStrokeRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDraw = (e) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    hasStrokeRef.current = false;
  };

  const saveAndInsert = (dataUrl) => {
    const next = [dataUrl, ...savedSigs.filter((s) => s !== dataUrl)].slice(0, 4);
    setSavedSigs(next);
    try {
      localStorage.setItem('nexpdf_signatures', JSON.stringify(next));
    } catch {
      // ignore quota
    }
    onInsertSignature(dataUrl);
    onClose();
  };

  const handleApplyDraw = () => {
    if (!hasStrokeRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    saveAndInsert(dataUrl);
  };

  const handleApplyTyped = () => {
    if (!typedText.trim()) return;
    const c = document.createElement('canvas');
    c.width = 520;
    c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = inkColor;
    ctx.font = SCRIPT_STYLES[scriptIdx].font;
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText.trim(), 24, 84);
    saveAndInsert(c.toDataURL('image/png'));
  };

  const handleUploadSig = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        saveAndInsert(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card glow-border rounded-2xl w-full max-w-lg p-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-display text-xl font-bold text-white mb-1">Create Digital Signature</h3>
        <p className="text-xs text-slate-400 mb-4">
          Draw, type, or upload a transparent signature to place anywhere on your PDF.
        </p>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/10 mb-4">
          {[
            { id: 'draw', label: 'Draw', icon: PenTool },
            { id: 'type', label: 'Type', icon: Type },
            { id: 'upload', label: 'Upload', icon: Upload },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Ink Color Selector */}
        {tab !== 'upload' && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-300">Ink Color</span>
            <div className="flex items-center gap-2">
              {INK_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setInkColor(col)}
                  style={{ backgroundColor: col }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    inkColor === col ? 'border-cyan-400 scale-110' : 'border-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {tab === 'draw' && (
          <div>
            <div className="rounded-xl bg-white border border-white/20 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={520}
                height={180}
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={endDraw}
                className="w-full h-44 cursor-crosshair touch-none"
              />
              <button
                type="button"
                onClick={clearPad}
                className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs hover:bg-slate-900"
              >
                <Eraser className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <MagneticButton onClick={handleApplyDraw} className="px-5 py-2 text-xs sm:text-sm">
                <Check className="w-4 h-4" /> Insert Signature
              </MagneticButton>
            </div>
          </div>
        )}

        {tab === 'type' && (
          <div className="space-y-3">
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="Type your signature"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
            <div className="grid grid-cols-1 gap-2">
              {SCRIPT_STYLES.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setScriptIdx(idx)}
                  className={`p-3 rounded-xl bg-white text-left border-2 transition-all ${
                    scriptIdx === idx ? 'border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.3)]' : 'border-transparent opacity-85'
                  }`}
                >
                  <div style={{ color: inkColor, font: st.font, fontSize: '28px', lineHeight: 1.2 }}>
                    {typedText || 'Signature Preview'}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-1">
              <MagneticButton onClick={handleApplyTyped} className="px-5 py-2 text-xs sm:text-sm">
                <Check className="w-4 h-4" /> Insert Typed Signature
              </MagneticButton>
            </div>
          </div>
        )}

        {tab === 'upload' && (
          <label className="block rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-400/60 p-8 text-center cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleUploadSig(e.target.files?.[0])}
            />
            <Upload className="w-8 h-8 text-cyan-300 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Upload Signature Image</p>
            <p className="text-xs text-slate-400 mt-1">Supports transparent PNG, JPG, or WebP</p>
          </label>
        )}

        {/* Saved signatures */}
        {savedSigs.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10">
            <p className="text-xs text-slate-400 mb-2">Saved Signatures (click to reuse)</p>
            <div className="grid grid-cols-4 gap-2">
              {savedSigs.map((sig, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onInsertSignature(sig);
                    onClose();
                  }}
                  className="h-12 rounded-lg bg-white p-1.5 border border-white/20 hover:border-cyan-400 transition-colors"
                >
                  <img src={sig} alt="Saved signature" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
