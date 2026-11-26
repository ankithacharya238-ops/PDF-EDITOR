import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, FolderOpen, Trash2 } from 'lucide-react';
import TiltCard3D from '../../animations/TiltCard3D';

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function RecentDocsSection({ docs, onOpenDoc, onDeleteDoc }) {
  if (!docs || docs.length === 0) return null;

  return (
    <section className="relative py-10 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-300" />
              Recent Documents
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Saved projects stored locally in IndexedDB—pick up right where you left off.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {docs.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <TiltCard3D className="glass-card p-3.5 h-full flex flex-col justify-between group">
                <div>
                  <div
                    onClick={() => onOpenDoc(doc.id)}
                    className="h-36 rounded-xl bg-slate-900/90 border border-white/10 overflow-hidden mb-3 flex items-center justify-center cursor-pointer relative"
                  >
                    {doc.thumbnailDataUrl ? (
                      <img
                        src={doc.thumbnailDataUrl}
                        alt={doc.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-violet-300/70" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                        <FolderOpen className="w-3.5 h-3.5" /> Open in Studio
                      </span>
                    </div>
                  </div>

                  <h4
                    onClick={() => onOpenDoc(doc.id)}
                    className="font-medium text-sm text-white truncate cursor-pointer hover:text-cyan-300 transition-colors"
                    title={doc.name}
                  >
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(doc.fileSize)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-[11px] text-slate-400">
                  <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDoc(doc.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from recent documents"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </TiltCard3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
