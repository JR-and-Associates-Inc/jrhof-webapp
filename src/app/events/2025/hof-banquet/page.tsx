import Link from 'next/link';

export default function HOF2025BanquetPage() {
  return (
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6">
        <h1 className="text-4xl font-bold text-center mb-4">2025 HOF Induction Banquet</h1>
        <p className="text-center text-lg text-gray-700 dark:text-gray-300 mb-6">
          Relive the 2025 Hall of Fame Induction Banquet. Browse the Program and photo gallery from this memorable event.
        </p>

        {/* Thumbnail image or Program icon */}
        <div className="flex justify-center mb-6">
          <img
            src="https://cdn.jrhof.org/events/hof-banquet/2025/hof-banquet-2025-thumbnail2.png" // Replace with actual Program image or placeholder
            alt="2025 HOF Banquet Program"
            className="max-w-xl sm:max-w-2xl rounded shadow-md"
          />
        </div>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <a
            href="https://cdn.jrhof.org/events/hof-banquet/2025/JR%20HOF%20Program%202025.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
          >
            View Program (PDF)
          </a>
          <a
            href="https://cdn.jrhof.org/events/hof-banquet/2025/JR%20HOF%20Program%202025.pdf"
            download
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
          >
            Download Program
          </a>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-center mb-4">Photo Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/HOFBanquet2025-001.webp" alt="Banquet photo 1" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/HOFBanquet2025-002.webp" alt="Banquet photo 2" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/HOFBanquet2025-003.webp" alt="Banquet photo 3" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/HOFBanquet2025-004.webp" alt="Banquet photo 4" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/HOFBanquet2025-005.webp" alt="Banquet photo 5" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/HOFBanquet2025-006.webp" alt="Banquet photo 6" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/HOFBanquet2025-007.webp" alt="Banquet photo 7" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            </div>
        </div>

        <div className="text-center">
          <Link
            href="/events"
            className="inline-block bg-gray-500 hover:bg-gray-600 text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
          >
            Back to Events
          </Link>
        </div>
      </div>
    </main>
  );
}