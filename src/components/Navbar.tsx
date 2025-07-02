import React, { useState, useEffect } from "react";
import Link from 'next/link';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-[#004080]/95 py-3 px-4 shadow-md">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-base md:hidden">JRHOF</Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white md:hidden"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>
      <div className={`w-full ${isOpen ? "flex" : "hidden"} flex-col md:hidden`}>
        <Link href="/" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Home</Link>
        <Link href="/about" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">About</Link>
        <Link href="/inductees" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Inductees</Link>
        <Link href="/events" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Events</Link>
        {/* <Link href="/donate" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Donate</Link> */}
        <Link href="/contact" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Contact</Link>
        <a
          href="https://www.chsbua.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]"
        >
          CHSBUA
        </a>
      </div>
      <div className="hidden md:flex md:flex-row md:items-center md:justify-center">
        <Link href="/" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Home</Link>
        <Link href="/about" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">About</Link>
        <Link href="/inductees" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Inductees</Link>
        <Link href="/events" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Events</Link>
        {/* <Link href="/donate" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Donate</Link> */}
        <Link href="/contact" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Contact</Link>
        <a
          href="https://www.chsbua.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]"
        >
          CHSBUA
        </a>
      </div>
    </nav>
  );
};

export default Navbar;