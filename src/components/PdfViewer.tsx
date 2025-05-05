'use client';

import { useEffect, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfViewer = ({ fileUrl }: { fileUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(800);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjs.getDocument(fileUrl);
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

      const page = await pdfDoc.getPage(num);
      const scale = canvasWidth / page.getViewport({ scale: 1 }).width;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
    };

    renderPage(currentPage);
  }, [pdfDoc, currentPage, canvasWidth]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setCanvasWidth(canvasRef.current.clientWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(parseInt(e.target.value));
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <button
          onClick={goToPrevPage}
          className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px]"
        >
          Prev
        </button>
        <button
          onClick={() => window.open(fileUrl, '_blank')}
          className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px]"
        >
          Download PDF
        </button>
        <button
          onClick={goToNextPage}
          className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.8rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px]"
        >
          Next
        </button>
      </div>

      <input
        id="page-slider"
        type="range"
        min="1"
        max={totalPages}
        value={currentPage}
        onChange={handleSliderChange}
        className="w-64 mb-4"
        aria-label="Page number slider"
      />

      <canvas ref={canvasRef} className="shadow-md w-full max-w-4xl" />
      <div className="text-center mt-2">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default PdfViewer;