'use client';

import { useEffect, useState, useRef } from 'react';
import inductees from '@/data/parsedInductees.json';
import ReactMarkdown from 'react-markdown';

const SLIDE_DURATION = 10000; // 10 seconds per slide

export default function InducteeSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fade, setFade] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const current = inductees[currentIndex];

  const imageFile = current?.['Image'];
  const imagePath =
    imageFile && imageFile.trim() !== 'undefined' && imageFile.trim() !== ''
      ? `/images/inductees/${imageFile.trim()}`
      : '/images/inductees/default_inductee.png';

  const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      elem.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % inductees.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + inductees.length) % inductees.length);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === 'f') {
        toggleFullScreen(); // Toggle full screen when pressing 'f'
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      timerRef.current = setTimeout(() => {
        setFade(true); // Set fade to true to trigger fade-out
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % inductees.length);
          setFade(false); // Reset fade after switching
        }, 500); // Match duration with the fade-out time
      }, SLIDE_DURATION);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused]);

  return (
    <>
      {current && current['Name'] && current['Year'] ? (
        <div className="w-full h-screen bg-black text-white flex flex-col items-center justify-center px-0 py-0 pt-0 transition-all duration-1000 ease-in-out">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 text-center">
            {current['Name']} ({current['Year']})
          </h1>

          <div className={`relative w-full max-w-md aspect-square mb-4 rounded shadow-lg overflow-hidden transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
            <img
              src={imagePath}
              alt={`Photo of ${current['Name']}, inducted in ${current['Year']}`}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = '/images/inductees/default_inductee.png';
              }}
            />
          </div>

          <div className="max-w-3xl text-lg text-center overflow-y-auto max-h-60">
            <ReactMarkdown>{current.bio}</ReactMarkdown>
          </div>

          <p className="mt-8 text-sm text-gray-400">Use ← → arrows to navigate, space to pause, &#39;f&#39; to toggle full screen</p>
          
          <button
            onClick={toggleFullScreen}
            className="absolute top-4 right-4 bg-blue-600 text-white p-2 rounded-md"
          >
            Fullscreen
          </button>
        </div>
      ) : (
        <div className="text-white text-center p-8">Loading inductee info...</div>
      )}
    </>
  );
}