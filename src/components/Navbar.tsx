import { useState, useEffect } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ensure the component has mounted before using window or state-dependent logic
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Don't render the component until the client has mounted
  }

  return (
    <nav className="bg-[#004080]/95 py-3 px-4 shadow-md mb-8">
      <div className="flex items-center justify-between">
        <a href="/" className="text-white font-bold text-base md:hidden">JRHOF</a>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white md:hidden"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>
      <div className={`w-full ${isOpen ? "flex" : "hidden"} flex-col md:hidden`}>
        <a href="/" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Home</a>
        <a href="/about" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">About</a>
        <a href="/inductees" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Inductees</a>
        <a href="/#events" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Events</a>
        <a href="/programs" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Programs</a>
      </div>
      <div className="hidden md:flex md:flex-row md:items-center md:justify-center">
        <a href="/" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Home</a>
        <a href="/about" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">About</a>
        <a href="/inductees" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Inductees</a>
        <a href="/#events" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Events</a>
        <a href="/programs" className="text-white mx-4 no-underline font-bold text-base transition-colors duration-200 hover:text-[#ffcc00]">Programs</a>
      </div>
    </nav>
  );
};

export default Navbar;