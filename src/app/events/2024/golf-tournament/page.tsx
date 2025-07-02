'use client';
import Link from 'next/link';
import { Gallery } from "@/components/Gallery";
import golfTournamentImages from "@/data/golf_tournament_2024.json";

export default function GolfTournament2025Page() {
  return (
    <main className="max-w-7xl mx-auto py-8">
        <div className="w-full max-w-screen-xl mx-auto bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold text-center mb-2">Joe Rossi Hall of Fame Presents - The Umpire&apos;s Cup II</h1>
      <h2 className="text-xl font-bold text-center mb-2">Sponsored by: KSK | Photography by: <a href="https://www.lebaronportraits.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">LeBaron Portraits</a></h2>
      <p className="text-center text-lg mb-6">
        Welcome to the gallery for The 2024 Umpire&apos;s Cup III Golf Tournament! Here you can relive the highlights and memorable moments from this year&apos;s event.
        Special thanks to Scott LeBaron and <a href="https://www.lebaronportraits.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">LeBaron Portraits</a> for capturing these amazing images.
      </p>
      <Gallery images={golfTournamentImages} />
        </div>
        <div className="w-full max-w-screen-xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-center">
          <Link
            href="/events"
            className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
          >
            Back to Events
          </Link>
        </div>
    </main>
  );
}