import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import LandingPage from './pages/LandingPage';
import EditorPage from './pages/EditorPage';
import CustomCursor from './animations/CustomCursor';
import ToastContainer from './components/common/ToastContainer';
import AuthModal from './components/common/AuthModal';
import UploadProgressModal from './components/common/UploadProgressModal';
import { useToast } from './hooks/useToast';
import { useRecentDocs } from './hooks/useRecentDocs';
import { loadPdfJsDocument } from './pdf/pdfjsSetup';
import { generateSamplePdfBytes } from './pdf/samplePdfGenerator';

export default function App() {
  const { toasts, addToast, removeToast } = useToast();
  const { recentDocs, saveDocumentProject, getDocumentById, deleteDocumentById } = useRecentDocs();

  const [cursorFxEnabled, setCursorFxEnabled] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexpdf_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });

  const [uploadState, setUploadState] = useState({
    visible: false,
    progress: 0,
    statusText: '',
    fileName: '',
  });

  const [docSession, setDocSession] = useState(null);

  const openPdfBytes = async ({ bytes, name, id = null, restoredPagesState = null }) => {
    try {
      setUploadState({
        visible: true,
        progress: 25,
        statusText: 'Reading PDF binary stream...',
        fileName: name,
      });

      const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      const pdfjsDoc = await loadPdfJsDocument(uint8);

      setUploadState({
        visible: true,
        progress: 70,
        statusText: `Preparing ${pdfjsDoc.numPages} page(s) for editing...`,
        fileName: name,
      });

      const initialPagesState =
        restoredPagesState && restoredPagesState.length > 0
          ? restoredPagesState
          : Array.from({ length: pdfjsDoc.numPages }, (_, idx) => ({
              id: `page-${idx}-${Date.now()}`,
              isBlank: false,
              sourcePageIndex: idx,
              width: 612,
              height: 792,
              rotationDelta: 0,
              removedTextIds: [],
              removedImageIds: [],
              fabricJson: { version: '5.3.0', objects: [] },
            }));

      setUploadState({
        visible: true,
        progress: 100,
        statusText: 'Launching NexPDF Studio...',
        fileName: name,
      });

      setTimeout(() => {
        setUploadState({ visible: false, progress: 0, statusText: '', fileName: '' });
        setDocSession({
          id,
          name,
          pdfBytes: uint8,
          pdfjsDoc,
          initialPagesState,
        });
        addToast(`Opened "${name}" (${pdfjsDoc.numPages} pages)`, 'success');
      }, 260);
    } catch (err) {
      console.error('Failed to open PDF:', err);
      setUploadState({ visible: false, progress: 0, statusText: '', fileName: '' });
      addToast('Could not open PDF. Make sure it is a valid, uncorrupted PDF file.', 'error');
    }
  };

  const handleFileSelected = async (file) => {
    const buffer = await file.arrayBuffer();
    await openPdfBytes({
      bytes: new Uint8Array(buffer),
      name: file.name,
    });
  };

  const handleLoadSample = async () => {
    setUploadState({
      visible: true,
      progress: 18,
      statusText: 'Generating interactive sample PDF...',
      fileName: 'NexPDF_Sample_Proposal.pdf',
    });
    const bytes = await generateSamplePdfBytes();
    await openPdfBytes({
      bytes,
      name: 'NexPDF_Sample_Proposal.pdf',
    });
  };

  const handleCreateBlank = async () => {
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]);
    const bytes = await doc.save();
    await openPdfBytes({
      bytes,
      name: 'Untitled_Document.pdf',
    });
  };

  const handleOpenRecentDoc = async (docId) => {
    const record = await getDocumentById(docId);
    if (!record) {
      addToast('Saved document not found in local store', 'error');
      return;
    }
    await openPdfBytes({
      id: record.id,
      bytes: record.pdfBytes,
      name: record.name,
      restoredPagesState: record.projectState,
    });
  };

  const handleDeleteRecentDoc = async (docId) => {
    await deleteDocumentById(docId);
    addToast('Removed document from Recent list', 'info');
  };

  return (
    <>
      <CustomCursor enabled={cursorFxEnabled} />

      {docSession ? (
        <EditorPage
          key={docSession.name + (docSession.id || '')}
          docSession={docSession}
          onBackHome={() => setDocSession(null)}
          onSaveToRecent={saveDocumentProject}
          onToast={addToast}
        />
      ) : (
        <LandingPage
          user={user}
          onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
          onSignOut={() => {
            localStorage.removeItem('nexpdf_session');
            setUser(null);
            addToast('Signed out', 'info');
          }}
          onFileSelected={handleFileSelected}
          onLoadSample={handleLoadSample}
          onCreateBlank={handleCreateBlank}
          recentDocs={recentDocs}
          onOpenRecentDoc={handleOpenRecentDoc}
          onDeleteRecentDoc={handleDeleteRecentDoc}
          cursorFxEnabled={cursorFxEnabled}
          onToggleCursorFx={() => setCursorFxEnabled((v) => !v)}
        />
      )}

      <AuthModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        onAuthSuccess={(u) => {
          setUser(u);
          addToast(`Signed in as ${u.name}`, 'success');
        }}
      />

      <UploadProgressModal {...uploadState} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
