
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export default function ProgramsPage() {
  const programsDir = path.join(process.cwd(), 'public', 'programs');
  const files = fs.readdirSync(programsDir);

  const years = files
    .map((file) => {
      const match = file.match(/^program_(\d{4})\.pdf$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((year): year is number => year !== null)
    .sort((a, b) => b - a); // Newest first

  return (
    <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <h1 className="text-3xl text-center py-3 font-bold mb-6">Banquet Programs</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {years.map((year) => (
          <Link
            key={year}
            href={`/programs/${year}`}
            className="w-fit mx-auto inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
          >
            {year} Banquet Program
          </Link>
        ))}
      </div>
    </div>
  );
}