'use client';
import inductees from '@/data/inductees.json';
import Image from 'next/image';
import Link from 'next/link';
import { Inductee } from '@/types/Inductee';
import { useState } from 'react';

export default function InducteesPage() {
  const parsedInductees: Inductee[] = (inductees as unknown as Inductee[]).map((i) => ({
    ...i,
    Year: Number(i.Year),
  }));
  const sortedInductees = parsedInductees.sort((a, b) => b.Year - a.Year);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredInductees = sortedInductees.filter((inductee) =>
    inductee.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <main className="p-6">
      <div className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <h1 className="text-3xl font-bold mb-4 text-center">Hall of Fame Inductees</h1>
        <div className="mb-4 text-center">
          <input
            type="text"
            placeholder="Search inductees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-3 border-2 border-blue-500 rounded-md w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-md text-lg"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredInductees.map((inductee) => {
            // Define the image path
            const imagePath = inductee.Image
              ? `/images/inductees/${inductee.Image}`
              : '/images/inductees/default_inductee.png';
              
            return (
              <div key={inductee.Name} className="border rounded shadow p-2 bg-white bg-opacity-80">
                <Image
                  src={imagePath}
                  alt={inductee.Name}
                  width={300}
                  height={300}
                  className="object-cover w-full h-auto"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = '/images/inductees/default_inductee.png';
                  }}
                />
                <h2 className="font-semibold mt-2">{inductee.Name}</h2>
                <p className="text-sm text-gray-600">Class of {inductee.Year}</p>
                <Link
                  href={`/${inductee["Bio URL"]}`}
                  className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                >
                  Read Bio
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}