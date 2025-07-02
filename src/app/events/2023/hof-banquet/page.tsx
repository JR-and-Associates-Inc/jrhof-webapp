import Link from 'next/link';

export default function HOF2025BanquetPage() {
  return (
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6">
        <h1 className="text-4xl font-bold text-center mb-4">2023 HOF Induction Banquet</h1>
        <p className="text-center text-lg text-gray-700 dark:text-gray-300 mb-6">
          Relive the 2023 Hall of Fame Induction Banquet. Browse the flyer and photo gallery from this memorable event.
        </p>

        {/* Thumbnail image or flyer icon */}
        <div className="flex justify-center mb-6">
          <img
            src="https://cdn.jrhof.org/events/hof-banquet/2023/hof-banquet-2023-thumbnail.png" // Replace with actual flyer image or placeholder
            alt="2023 HOF Banquet Flyer"
            className="max-w-full rounded shadow-md"
          />
        </div>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <a
            href="https://cdn.jrhof.org/events/hof-banquet/2023/JR%20HOF%20Program%202023.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
          >
            View Flyer (PDF)
          </a>
          <a
            href="https://cdn.jrhof.org/events/hof-banquet/2023/JR%20HOF%20Program%202023.pdf"
            download
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
          >
            Download Flyer
          </a>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-center mb-4">Photo Gallery</h2>
          <p className="text-center text-lg text-gray-700 dark:text-gray-300 mb-6">Photo Gallery Coming Soon!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Example images — replace with actual URLs or map through data 
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/photo1.webp" alt="Banquet photo 1" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/photo2.webp" alt="Banquet photo 2" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
            <img src="https://cdn.jrhof.org/events/hof-banquet/2025/photo3.webp" alt="Banquet photo 3" className="rounded shadow-md hover:scale-105 transition-transform duration-200" />
          */}
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