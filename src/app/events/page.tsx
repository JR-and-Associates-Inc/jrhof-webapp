'use client';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';

export default function EventsPage() {
  const handleBuyClick = async () => {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: 'price_golfTicket', quantity: 1 }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error('No URL returned from Stripe');
    }
  };

  return (
    <>
      <Head>
        <script async src="https://js.stripe.com/v3/buy-button.js"></script>
      </Head>
      <main className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <section id="events" className="text-center space-y-6">
          <h2 className="text-3xl font-semibold">Upcoming Events</h2>
          <p className="mt-4 font-bold">
            The Umpire&#39;s Cup III<br />
            Saturday, June 28, 2025 • 8:00 a.m.<br />
            $130.00 • Applewood Golf Club
          </p>
          <p className="mt-1 text-gray-600">
            14001 W. 32nd Ave., Golden, CO 80401
          </p>
          <ul className="mt-4 list-disc list-inside text-left max-w-md mx-auto">
            <p className='text-large font-bold'>Prizes will be awarded for: </p>
            <li>Men&#39;s Champion Foursome</li>
            <li>Mixed Champion Foursome</li>
            <li>Men&#39;s Long Drive</li>
            <li>Ladies&#39; Long Drive</li>
          </ul>
          <p className="mt-2">Includes breakfast burritos, lunch buffet, and more!</p>
          <div className="mt-4">
            <Image
              src="/golf_tournament_flyer_2025.png"
              alt="Golf Tournament Flyer"
              width={600}
              height={800}
              className="mx-auto"
            />
          </div>
          <button
            onClick={handleBuyClick}
            className="mt-6 px-6 py-4 bg-[#0078D7] text-white font-semibold rounded shadow hover:bg-[#005fa3] transition"
          >
            Buy Tickets
          </button>

        </section>
        <section>
          <p className="text-sm text-gray-500 mt-6 text-center">
            <em>
              Payments for this event are securely processed by our technology partner, <strong>TMCO Consulting, LLC</strong>.
              All proceeds go directly to the <strong>Joe Rossi Hall of Fame</strong> and our mission to honor high school umpire excellence.
            </em>
          </p>
        </section>
      </main>
    </>
  );
}