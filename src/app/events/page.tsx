import Link from 'next/link';

export default function EventsPage() {
  return (
    <main className="max-w-7xl mx-auto py-8">
      <div className="w-full max-w-screen-xl mx-auto bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] px-4 sm:px-6 lg:px-8 py-6 mb-8">
        <h1 className="text-4xl font-bold text-center mb-6">Upcoming Events</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/events/2026/hof-banquet" className="block p-4 rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-lg hover:translate-y-[-2px] hover:ring-2 hover:ring-[#0078D7] transition bg-white/80 dark:bg-[#333]">
            <h2 className="text-xl font-bold mb-2 text-center">2026 HOF Induction Banquet</h2>
            <p className="text-gray-700 dark:text-gray-300">Sign up and see event info for the 2026 Hall of Fame Induction Banquet.</p>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-4xl font-bold text-center mb-6">Past Events</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">We’re always adding more memories to our Past Events — check back often for updates and new galleries!</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/events/2025/golf-tournament" className="block p-4 rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-lg hover:translate-y-[-2px] hover:ring-2 hover:ring-[#0078D7] transition bg-white/80 dark:bg-[#333]">
            <h2 className="text-xl font-bold mb-2 text-center">2025 Golf Tournament</h2>
            <p className="text-gray-700 dark:text-gray-300">See event info and browse the gallery for the 2025 Umpire&apos;s Cup III Golf Tournament.</p>
          </Link>
          <Link href="/events/2025/hof-banquet" className="block p-4 rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-lg hover:translate-y-[-2px] hover:ring-2 hover:ring-[#0078D7] transition bg-white/80 dark:bg-[#333]">
            <h2 className="text-xl font-bold mb-2 text-center">2025 HOF Induction Banquet</h2>
            <p className="text-gray-700 dark:text-gray-300">See event info and browse the gallery for the 2025 Hall of Fame Induction Banquet.</p>
          </Link>
          <Link href="/events/2024/golf-tournament" className="block p-4 rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-lg hover:translate-y-[-2px] hover:ring-2 hover:ring-[#0078D7] transition bg-white/80 dark:bg-[#333]">
            <h2 className="text-xl font-bold mb-2 text-center">2024 Golf Tournament</h2>
            <p className="text-gray-700 dark:text-gray-300">See event info and browse the gallery for the 2024 Umpire&apos;s Cup II Golf Tournament.</p>
          </Link>
          <Link href="/events/2024/hof-banquet" className="block p-4 rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-lg hover:translate-y-[-2px] hover:ring-2 hover:ring-[#0078D7] transition bg-white/80 dark:bg-[#333]">
            <h2 className="text-xl font-bold mb-2 text-center">2024 HOF Induction Banquet</h2>
            <p className="text-gray-700 dark:text-gray-300">See event info and browse the gallery for the 2024 Hall of Fame Induction Banquet.</p>
          </Link>
          <Link href="/events/2023/hof-banquet" className="block p-4 rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-lg hover:translate-y-[-2px] hover:ring-2 hover:ring-[#0078D7] transition bg-white/80 dark:bg-[#333]">
            <h2 className="text-xl font-bold mb-2 text-center">2023 HOF Induction Banquet</h2>
            <p className="text-gray-700 dark:text-gray-300">See event info and browse the gallery for the 2023 Hall of Fame Induction Banquet.</p>
          </Link>
          <Link href="/events/2010/hof-banquet" className="block p-4 rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-lg hover:translate-y-[-2px] hover:ring-2 hover:ring-[#0078D7] transition bg-white/80 dark:bg-[#333]">
            <h2 className="text-xl font-bold mb-2 text-center">2010 HOF Induction Banquet</h2>
            <p className="text-gray-700 dark:text-gray-300">See event info and browse the gallery for the 2010 Hall of Fame Induction Banquet.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}