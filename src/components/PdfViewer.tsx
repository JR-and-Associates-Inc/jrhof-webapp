'use client';

import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

const PdfViewer = ({ fileUrl }: { fileUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
      } catch (error) {
        console.error('PDF load error:', error);
      }
    };

    loadPdf();
  }, [fileUrl]);

  useEffect(() => {
    const renderPage = async (num: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale as needed

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          console.error('Failed to get canvas context');
          return;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    };

    renderPage(currentPage);
  }, [pdfDoc, currentPage]);

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="pdf-viewer">
      <canvas ref={canvasRef} className="shadow-md border rounded-md" />
      <div className="controls mt-4 flex justify-center space-x-4">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PdfViewer;