// src/app/programs/page.tsx or wherever your button is located
import Link from 'next/link';

export default function ProgramList() {
  return (
    <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <h1 className="text-xl font-bold mb-4">Select a Program Year</h1>
      <Link
        href="/programs/2010"
        className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
      >
        View 2010 Program
      </Link>
    </div>
  );
}