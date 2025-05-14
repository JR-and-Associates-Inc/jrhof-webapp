'use client';

import { useEffect, useState, useRef } from 'react';
import inductees from '@/data/parsedInductees.json';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

const SLIDE_DURATION = 20000; // 20 seconds per slide
const FADE_DURATION = 500; // 0.5 seconds for fade transitions
const SCROLL_SPEED = 20; // Slower scroll speed (pixels per second)

export default function InducteeSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bioRef = useRef<HTMLDivElement | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const current = inductees[currentIndex];
  const imageFile = current.Image?.trim();
  const imagePath =
    imageFile && imageFile !== '' && imageFile.toLowerCase() !== 'undefined'
      ? `/images/inductees/${imageFile}`
      : '/images/inductees/missing_inductee.webp';

  const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      elem.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const goToNextSlide = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % inductees.length);
      setIsFading(false);
    }, FADE_DURATION);
  };

  const goToPreviousSlide = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + inductees.length) % inductees.length);
      setIsFading(false);
    }, FADE_DURATION);
  };

  const startAutoScroll = () => {
    if (bioRef.current) {
      const bioElement = bioRef.current;
      const maxScrollTop = bioElement.scrollHeight - bioElement.clientHeight;

      scrollIntervalRef.current = setInterval(() => {
        if (bioElement.scrollTop < maxScrollTop) {
          bioElement.scrollTop += SCROLL_SPEED / 10; // Slower scroll increment
        } else {
          clearInterval(scrollIntervalRef.current!);
        }
      }, 100); // Adjust scroll every 100ms
    }
  };

  const resetScroll = () => {
    if (bioRef.current) {
      bioRef.current.scrollTop = 0;
    }
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
  };

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setTimeout(goToNextSlide, SLIDE_DURATION);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused]);

  useEffect(() => {
    resetScroll();
    startAutoScroll();
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === 'f') {
        toggleFullScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      <div
        className={`w-full h-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-black/80 rounded-lg shadow-lg transition-opacity duration-${FADE_DURATION} ${
          isFading ? 'opacity-0' : 'opacity-100'
        } flex flex-col`}
      >
        {/* Header Section */}
        <section className="text-center mb-8">
          <h2 className="text-6xl sm:text-7xl font-bold text-white">{current.Name}</h2>
          <p className="text-3xl text-white font-medium mt-2">
            <span className="uppercase tracking-wide">Class of {current.Year}</span>
          </p>
        </section>

        {/* Image Section */}
        <div className="w-full flex justify-center items-center mb-6">
          <div className="w-full max-w-[250px] md:max-w-[300px]">
            <Image
              src={imagePath}
              alt={current.Name}
              layout="responsive"
              width={4}
              height={3}
              className="rounded-lg shadow-lg object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = '/images/inductees/missing_inductee.webp';
              }}
            />
          </div>
        </div>

        {/* Bio Section */}
        <div
          ref={bioRef}
          className="prose prose-lg sm:prose-2xl w-full text-white leading-relaxed overflow-y-auto max-h-[40vh] px-4 mb-4"
          style={{ fontSize: '1.5rem' }}
        >
          <ReactMarkdown>{current.bio}</ReactMarkdown>
        </div>

        {/* Navigation Buttons */}
        <div className="w-full flex justify-between px-6 mt-4 mb-2">
          <button
            onClick={goToPreviousSlide}
            className="bg-blue-600 text-white p-2 rounded-md"
          >
            Previous
          </button>
          <button
            onClick={toggleFullScreen}
            className="bg-blue-600 text-white p-2 rounded-md"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            onClick={goToNextSlide}
            className="bg-blue-600 text-white p-2 rounded-md"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}