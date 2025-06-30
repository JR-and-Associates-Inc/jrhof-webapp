import Link from 'next/link';


export const metadata = {
  title: '2026 HOF Induction Banquet | JRHOF',
  description: 'Celebrate the 2026 Colorado Baseball Umpires Joe Rossi Hall of Fame Induction Banquet.',
};

export default function InductionBanquet2026() {
  return (
    <>
      <main className="main-content container mx-auto px-4 sm:px-6 lg:px-8 py-10 overflow-x-hidden">
        <div className="w-full max-w-screen-xl mx-auto bg-white/90 dark:bg-[#2a2a2a]/90 rounded-2xl shadow-lg px-8 py-10">
          <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-8">
            2026 HOF Induction Banquet
          </h1>
            
          <p className="max-w-3xl mx-auto text-center text-lg text-gray-700 dark:text-gray-300 mb-10">
            It is time again for one of the highlights of the high school baseball season — the 2026 annual Colorado Baseball Umpires Joe Rossi Hall of Fame Induction Banquet. This special event is held the day before the CHSBUA Master Clinic and honors the exceptional individuals who have contributed so much to the game of baseball in Colorado.
          </p>

          <p className="max-w-3xl mx-auto text-center text-lg text-gray-700 dark:text-gray-300 mb-10">
            Please give serious consideration to attending this banquet to celebrate and show gratitude to our new inductees. Don’t forget to include your significant others and friends in your registration!
          </p>

          <section className="max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b-2 border-blue-600 pb-2">
              Event Details
            </h2>
            <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-lg list-disc list-inside">
              <li><strong>Date:</strong> Saturday, January 31, 2026</li>
              <li><strong>Time:</strong> 12:00 PM – 4:00 PM</li>
              <li><strong>Location:</strong> Holiday Inn Denver–Lakewood<br />7390 W. Hampden Ave., Lakewood, CO 80227</li>
            </ul>
          </section>

          <section className="max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b-2 border-blue-600 pb-2">
              Hotel Accommodations
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              A special room rate is available at the Holiday Inn Denver–Lakewood. Make your reservation by calling <strong>(303) 980-9200</strong> and using <strong>GROUP CODE: JRH</strong> before <strong>January 16, 2026</strong>.
            </p>
          </section>

          <section className="max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b-2 border-blue-600 pb-2">
              Class of 2026 Inductees
            </h2>
            <ul className="list-disc list-inside max-w-md mx-auto text-gray-700 dark:text-gray-300 text-lg space-y-1">
              <li>Terry Angell</li>
              <li>George Demetriou</li>
              <li>Fred Zuercher</li>
            </ul>
            <p className="italic text-center mt-4 text-gray-500 dark:text-gray-400">Photos and biographies coming soon.</p>
          </section>

          <section className="max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b-2 border-blue-600 pb-2">
              Registration
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-md mx-auto mb-4 text-center">
              <span className="font-semibold text-green-700 dark:text-green-400">$43</span> before December 14, 2025 <br />
              <span className="font-semibold text-red-700 dark:text-red-400">$50</span> from December 15, 2025 to January 25, 2026
            </p>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Business casual attire is recommended. Please include significant others and friends in your registration.
            </p>
            <p className="text-center font-semibold text-blue-700 dark:text-blue-400 underline cursor-not-allowed">
              Registration Link: (coming soon)
            </p>
          </section>

          <section className="max-w-3xl mx-auto">
  <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b-2 border-blue-600 pb-2">
    Questions?
  </h2>
  <p className="text-center text-lg text-blue-600 dark:text-blue-400 underline cursor-pointer mb-2">
    <Link href="/contact">
      Contact Us
    </Link>
  </p>
</section>
        </div>
      </main>
    </>
  );
}