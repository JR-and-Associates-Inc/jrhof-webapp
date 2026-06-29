// src/app/programs/2010/page.tsx
export default function Program2010() {
  return (
    <>
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">2010 HOF Induction Banquet</h1>
        <p className="text-center text-lg text-gray-700 dark:text-gray-300 mb-6">
          Relive the 2010 Hall of Fame Induction Banquet. Browse the flyer and gallery from this memorable event.
        </p>
        <div className="flex justify-center mb-6">
          <img
            src="https://cdn.jrhof.org/events/hof-banquet/2010/hof-banquet-2010-thumbnail.jpg" // Replace with actual thumbnail if available
            alt="2010 HOF Banquet Flyer"
            className="max-w-full rounded shadow-md"
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <a
            href="https://cdn.jrhof.org/events/hof-banquet/2010/2010%20HOF%20Induction%20Banquet.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
          >
            View Program (PDF)
          </a>
          <a
            href="https://cdn.jrhof.org/events/hof-banquet/2010/2010%20HOF%20Induction%20Banquet.pdf"
            download
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
          >
            Download Program
          </a>
        </div>
      </div>
    </>
  );
}