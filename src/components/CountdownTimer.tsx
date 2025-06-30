'use client';
import React, { useEffect, useState } from 'react';

const targetDate = new Date('2026-01-31T12:00:00');

function calculateTimeLeft() {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof calculateTimeLeft> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!hydrated || timeLeft === null) {
    return (
      <p className="text-center text-green-700 dark:text-green-400 font-semibold text-xl mb-6">
        The 2026 HOF Induction Banquet is happening today!
      </p>
    );
  }

  return (
    <div className="flex justify-center gap-6 mb-8 text-center text-blue-700 dark:text-blue-400">
      {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
        <div key={unit} className="flex flex-col items-center bg-white/90 dark:bg-gray-800 rounded-lg shadow-md px-6 py-4 min-w-[70px]">
          <span className="text-4xl font-extrabold tabular-nums">
            {timeLeft[unit as keyof typeof timeLeft]}
          </span>
          <span className="uppercase text-xs tracking-widest mt-1 select-none">{unit}</span>
        </div>
      ))}
    </div>
  );
}