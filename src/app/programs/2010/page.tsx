import AdSense from '@/components/AdSense';
// src/app/programs/2010/page.tsx
export default function Program2010() {
  return (
    <>
      <AdSense />
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">2010 Program</h1>
        <div className="relative w-full min-h-[600px] sm:min-h-[700px] lg:min-h-[900px]">
          <iframe
            src="/programs/program_2010.pdf"
            className="absolute top-0 left-0 w-full h-full border rounded"
            title="2010 Program PDF"
          />
        </div>
        <div className="text-center">
          <a
            href="/programs/program_2010.pdf"
            download
            className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-lg shadow"
          >
            Download PDF
          </a>
        </div>
      </div>
    </>
  );
}