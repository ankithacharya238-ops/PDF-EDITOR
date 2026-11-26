import { useCallback, useEffect, useState } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'nexpdf_workspace_db';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    },
  });
}

/**
 * Stores real PDF binary bytes + serialized edit state in IndexedDB
 * so Recent Documents and Save Project work genuinely across reloads.
 */
export function useRecentDocs() {
  const [recentDocs, setRecentDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const refreshDocs = useCallback(async () => {
    try {
      const db = await getDb();
      const all = await db.getAll(STORE_NAME);
      all.sort((a, b) => b.updatedAt - a.updatedAt);
      setRecentDocs(all.slice(0, 8));
    } catch (err) {
      console.error('Failed to load recent docs:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    refreshDocs();
  }, [refreshDocs]);

  const saveDocumentProject = useCallback(
    async ({ id, name, pdfBytes, pageCount, fileSize, projectState, thumbnailDataUrl }) => {
      const db = await getDb();
      const docId = id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const record = {
        id: docId,
        name: name || 'Untitled.pdf',
        pdfBytes: pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes),
        pageCount: pageCount || 1,
        fileSize: fileSize || pdfBytes?.byteLength || 0,
        projectState: projectState || null,
        thumbnailDataUrl: thumbnailDataUrl || null,
        updatedAt: Date.now(),
      };
      await db.put(STORE_NAME, record);
      await refreshDocs();
      return docId;
    },
    [refreshDocs]
  );

  const getDocumentById = useCallback(async (id) => {
    const db = await getDb();
    return db.get(STORE_NAME, id);
  }, []);

  const deleteDocumentById = useCallback(
    async (id) => {
      const db = await getDb();
      await db.delete(STORE_NAME, id);
      await refreshDocs();
    },
    [refreshDocs]
  );

  return {
    recentDocs,
    loadingDocs,
    saveDocumentProject,
    getDocumentById,
    deleteDocumentById,
    refreshDocs,
  };
}
