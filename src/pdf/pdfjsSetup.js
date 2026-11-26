import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export async function loadPdfJsDocument(pdfBytes) {
  const copy = pdfBytes instanceof Uint8Array ? pdfBytes.slice() : new Uint8Array(pdfBytes);
  const loadingTask = pdfjsLib.getDocument({
    data: copy,
    cMapPacked: true,
    useSystemFonts: true,
  });
  return loadingTask.promise;
}

export { pdfjsLib };
