import Image from 'next/image';
const Header = () => {
  return (
    <header className="bg-black/85 text-white py-5 px-4 bg-cover bg-center bg-blend-overlay">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Image
          src="/images/HOF-Dinner-Pin-v2 042522.jpg"
          alt="Left Logo"
          width={100}
          height={80}
          className="w-auto h-20"
        />
        <div className="text-center flex-1 px-4">
          <p className="text-xl m-0">Colorado High School Baseball Umpire&apos;s Association</p>
          <h1 className="text-5xl font-bold mb-2 font-serif drop-shadow-[1px_1px_4px_black]">
            Joe Rossi Hall of Fame
          </h1>
          <p className="text-xl m-0">
            where individuals who have contributed much to the game of baseball in Colorado are honored
          </p>
        </div>
        <Image
          src="/images/CHSBUA logo 1.png"
          alt="Right Logo"
          width={100}
          height={80}
          className="w-auto h-20"
        />
      </div>
    </header>
  );
};

export default Header;