// src/app/programs/page.tsx
import Link from 'next/link';

export default function ProgramsPage() {
  return (
    <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <h1 className="text-3xl font-bold mb-6">Programs Coming Soon</h1>
      <p className="text-lg mb-4">
        We are working on updating our past year program archive. Stay tuned!
      </p>
      <Link href="/" className="text-blue-600 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}