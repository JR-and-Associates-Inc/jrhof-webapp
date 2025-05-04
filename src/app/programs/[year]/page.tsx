'use client';

import { useParams } from 'next/navigation';
import PdfViewer from '@/components/PdfViewer';

export default function ProgramPage() {
  const { year } = useParams();

  const fileUrl = `/programs/program_${year}.pdf`;
  const title = `${year} Program Archive`;

  return (
    <section className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <h1 className="text-3xl font-bold text-center mb-6">{title}</h1>
      <div className="border shadow-lg rounded overflow-hidden">
        <div className="w-full p-4 flex justify-center">
          <div className="w-full max-w-4xl">
            <PdfViewer fileUrl={fileUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}