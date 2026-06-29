'use client';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="w-full max-w-screen-md mx-auto my-12 px-4 sm:px-6 lg:px-8 py-8 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-lg text-center">
      <h1 className="text-5xl font-bold mb-4 text-red-700 dark:text-red-400 drop-shadow-sm">⚾ Strike Three!</h1>
      <p className="text-xl mb-6 text-gray-700 dark:text-gray-300">
        You&#39;re outta here... or at least this page is. We couldn&#39;t find what you were looking for.
      </p>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Don&#39;t worry, you&#39;re still in the Hall of Fame. Try one of the links below to get back on base:
      </p>
      <div className="flex justify-center gap-4 flex-wrap mb-8">
        <Link href="/" className="bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold py-2 px-4 rounded shadow">
          🏠 Home
        </Link>
        <Link href="/inductees" className="bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold py-2 px-4 rounded shadow">
          🧢 Inductees
        </Link>
        <Link href="/programs" className="bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold py-2 px-4 rounded shadow">
          📘 Programs
        </Link>
        <Link href="/events" className="bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold py-2 px-4 rounded shadow">
          📅 Events
        </Link>
      </div>
      <p className="text-sm text-muted-foreground dark:text-gray-400">
        Error 404 – Page not found. But legends never fade.
      </p>
    </main>
  );
}