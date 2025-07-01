import React, { useState, useEffect } from "react";
import Link from 'next/link';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setFadeIn(false);
    }
  }, [showModal]);

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
        <Link href="/2026-hof-induction-banquet" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">
  2026 HOF Banquet
</Link>
        <Link href="/programs" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Programs</Link>
        {/* <Link href="/donate" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Donate</Link> */}
        <Link href="/contact" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Contact</Link>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowModal(true);
          }}
          className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]"
        >
          CHSBUA
        </a>
      </div>
      <div className="hidden md:flex md:flex-row md:items-center md:justify-center">
        <Link href="/" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Home</Link>
        <Link href="/about" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">About</Link>
        <Link href="/inductees" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Inductees</Link>
        <Link href="/2026-hof-induction-banquet" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">
  2026 HOF Banquet
</Link>
        <Link href="/programs" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Programs</Link>
        {/* <Link href="/donate" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Donate</Link> */}
        <Link href="/contact" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Contact</Link>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowModal(true);
          }}
          className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]"
        >
          CHSBUA
        </a>
      </div>
      {showModal && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${
            fadeIn ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-white p-6 rounded shadow-lg text-center max-w-sm w-full transition-opacity duration-300">
            <p className="text-black mb-4">You are leaving JRHOF.org. Continue to CHSBUA.com?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  window.open("https://www.chsbua.com", "_blank", "noopener,noreferrer");
                  setShowModal(false);
                }}
                className="bg-[#004080] text-white px-4 py-2 rounded hover:bg-[#003366]"
              >
                Yes, Continue
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;