import Image from "next/image";
import inductees from '@/data/inductees.json';
import Link from 'next/link';
import { Inductee } from '@/types/Inductee';

const currentYear = new Date().getFullYear().toString(); // Get the current year as a string

// Filter inductees for the current year
const thisYearsInductees = (inductees as Inductee[]).filter(
  (inductee) => inductee.Year === currentYear
);

export default function HomePage() {
  return (
    <main className="p-6">
      {/* Our Mission Section */}
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="about" className="text-center space-y-6">
          <h2 className="text-3xl font-bold">Our Mission</h2>
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
      <div className="flex w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="inductees" className="text-center space-y-6">
          <h2 className="text-3xl font-semibold text-center">
            {currentYear} Hall of Fame Inductees
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-auto-fit gap-4">
            {(thisYearsInductees as Inductee[]).map((inductee) => (
              <div key={inductee.Name} className="border rounded shadow p-2 bg-white bg-opacity-80">
                <Image
                  src={`/images/inductees/${inductee.Image ? inductee.Image : 'default_inductee.jpg'}`}
                  alt={inductee.Name}
                  width={300}
                  height={300}
                  className="object-cover w-full h-auto"
                />
                <h2 className="font-semibold mt-2">{inductee.Name}</h2>
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
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="events" className="text-center space-y-6">
          <h2 className="text-3xl font-semibold">Upcoming Events</h2>
          <p className="mt-4 font-bold">The Umpire&#39;s Cup III<br />Saturday, June 28, 2025 • 8:00 a.m.<br />$130.00 • Applewood Golf Club</p>
          <p className="mt-1 text-gray-600">14001 W. 32nd Ave., Golden, CO 80401</p>
          <div className="mt-4">
            <Image src="/golf_tournament_flyer_2025.png" alt="Golf Tournament Flyer" width={600} height={800} className="mx-auto" />
          </div>
          <ul className="mt-4 list-disc list-inside">
            <li>Men&#39;s Champion Foursome</li>
            <li>Mixed Champion Foursome</li>
            <li>Men&#39;s Long Drive</li>
            <li>Ladies&#39; Long Drive</li>
          </ul>
          <p className="mt-2">Includes breakfast burritos, lunch buffet, and more!</p>
          <Link
            className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
            href="https://www.eventbrite.com/e/joe-rossi-hof-golf-tournament-2025-tickets-1119450780419"
            target="_blank"
            rel="noopener noreferrer"
          >
            🎟️ Register NOW!
          </Link>
        </section>
      </div>

      {/* Program Archive Section */}
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="program" className="text-center space-y-6">
          <h2 className="text-3xl font-semibold">Explore Our Program Archive</h2>
          <p className="mt-2">Browse scanned programs from past Hall of Fame celebrations...</p>
          <p className="mt-4">
            <Link
              href="/programs"
              className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
            >
              View Programs
            </Link>
          </p>
        </section>
      </div>

      {/* Support Section */}
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="donate" className="text-center space-y-6">
          <h2 className="text-3xl font-semibold">Support the Hall of Fame</h2>
          <p className="mt-2">Your contributions help maintain the legacy of our inductees and support future events.</p>
        </section>
      </div>
    </main>
  );
}