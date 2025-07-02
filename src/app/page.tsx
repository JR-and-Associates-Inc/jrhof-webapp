import Image from "next/image";
import inductees from '@/data/inductees.json';
import Link from 'next/link';
import { Inductee } from '@/types/Inductee';
import CountdownTimer from "@/components/CountdownTimer";

const currentYear = new Date().getFullYear().toString(); // Get the current year as a string

// Filter inductees for the current year
const thisYearsInductees = (inductees as unknown as Inductee[]).filter(
  (inductee) => inductee.Year.toString() === currentYear
);

export default function HomePage() {
  return (
    <main className="p-6">
      {/* Our Mission Section */}
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="about" className="text-center space-y-6">
          <h2 className="text-4xl font-bold">Our Mission</h2>
          <p className="italic max-w-3xl mx-auto">
            The Joe Rossi Hall of Fame is a 501(c)(3) nonprofit dedicated to honoring and preserving
            the legacy of high school baseball umpires throughout Colorado. By recognizing those
            who&#39;ve made lasting contributions to the game, we aim to inspire future generations
            of leaders, mentors, and community stewards.
          </p>
          <Link
            href="/about"
            className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
          >
            Click to Learn More
          </Link>
        </section>
      </div>

      {/* This Year&#39;s Inductees Section */}
      <div className="flex w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="inductees" className="text-center space-y-6">
          <h2 className="text-4xl font-semibold text-center">
            {currentYear} Hall of Fame Inductees
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-auto-fit gap-4">
            {(thisYearsInductees as Inductee[]).map((inductee) => (
              <div key={inductee.Name} className="border rounded shadow p-2 bg-white/80 dark:bg-[#2a2a2a]/85">
                <Image
                  src={`/images/inductees/${inductee.Image ? inductee.Image : 'default_inductee.jpg'}`}
                  alt={inductee.Name}
                  width={300}
                  height={300}
                  className="object-cover w-full h-auto"
                />
                <h2 className="font-semibold mt-2 text-gray-800 dark:text-gray-100">{inductee.Name}</h2>
                <Link
                  href={`/${inductee["Bio URL"]}`}
                  className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                >
                  Read Bio
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/inductees"
              className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
            >
              See All Inductees
            </Link>
          </div>
        </section>
      </div>

      {/* Upcoming Events Section */}
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="events" className="text-center space-y-6">
          <h2 className="text-4xl font-semibold">
            🎉 2026 HOF Induction Banquet 🎉
          </h2>
          <CountdownTimer />
          <p className="max-w-3xl mx-auto text-center text-lg text-gray-700 dark:text-gray-300 font-medium">
            This is the highlight event of the year where we honor our previous Hall of Fame members and induct the Class of 2026: <strong>Terry Angell</strong>, <strong>George Demetriou</strong>, and <strong>Fred Zuercher</strong>. Join us in celebrating their contributions!
          </p>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Photos & Bios coming soon!
          </p>
          <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-lg list-disc list-inside">
            <li><strong>Date:</strong> Saturday, January 31, 2026</li>
            <li><strong>Time:</strong> 12:00 PM – 4:00 PM</li>
            <li><strong>Location:</strong> Holiday Inn Denver–Lakewood<br />7390 W. Hampden Ave., Lakewood, CO 80227</li>
          </ul>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Special room rate available — call <strong>(303) 980-9200</strong> with <strong>GROUP CODE: JRH</strong> by <strong>January 16, 2026</strong>.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-green-700 dark:text-green-400">$43</span> before December 14, 2025 <br />
            <span className="font-semibold text-red-700 dark:text-red-400">$50</span> December 15, 2025 – January 25, 2026
          </p>
          <p className="text-center text-gray-600 dark:text-gray-400 italic">
            Business casual attire recommended.
          </p>
          <p className="text-center font-semibold text-blue-700 dark:text-blue-400 underline cursor-not-allowed">
            Registration Link: (coming soon)
          </p>
            <Link
            href="/events/2026/hof-banquet"
            className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
          >
            Click to Learn More
          </Link>
        </section>
      </div>

      {/* Program Archive Section */}
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="program" className="text-center space-y-6">
          <h2 className="text-4xl font-semibold">Explore Our Events Archive</h2>
          <p className="mt-2">Browse scanned programs and photos from past Hall of Fame celebrations...</p>
          <p className="mt-4">
            <Link
              href="/events"
              className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
            >
              View Events
            </Link>
          </p>
        </section>
      </div>

      {/* Support Section */}
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="donate" className="text-center space-y-6">
          <h2 className="text-4xl font-semibold">Support the Hall of Fame</h2>
          <p className="mt-2">Your contributions help maintain the legacy of our inductees and support future events.</p>
        </section>
      </div>
    </main>
  );
}