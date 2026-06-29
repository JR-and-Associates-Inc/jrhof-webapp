"use client";
import Head from "next/head";
import Link from "next/link";

export default function GolfTournament2026Page() {
  return (
    <>
      <Head>
        <title>2026 JRHOF Golf Tournament | Joe Rossi Hall of Fame</title>
        <meta
          name="description"
          content="Register for the 2026 Joe Rossi Hall of Fame Golf Classic. Enjoy a day on the green, support the HOF, and connect with members. Sign up today!"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsEvent",
              "name": "2026 Joe Rossi Hall of Fame Golf Classic",
              "startDate": "2026-06-14T08:00",
              "location": {
                "@type": "Place",
                "name": "Littleton Golf and Tennis Club",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "123 Main St",
                  "addressLocality": "Littleton",
                  "addressRegion": "CO",
                  "postalCode": "80123",
                  "addressCountry": "US"
                }
              },
              "url": "https://jrhof.org/events/2026/golf-tournament",
              "offers": {
                "@type": "Offer",
                "url": "https://www.eventbrite.com/e/joe-rossi-hall-of-fame-golf-classic-tickets-1754953445999",
                "price": "150",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "validFrom": "2025-11-01T00:00"
              }
            })
          }}
        />
      </Head>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6 mb-8">
          <h1 className="text-4xl font-bold text-center mb-4">
            2026 JRHOF Golf Tournament
          </h1>
          <p className="text-center text-lg text-gray-700 dark:text-gray-300 mb-6">
            Don’t miss the 2026 Joe Rossi Hall of Fame Golf Classic! Register today to secure your spot for this exciting charity golf event. Enjoy a day on the green, connect with Hall of Fame members, and support our mission. Click the “Register Now” button below to sign up.
          </p>

          <div className="flex justify-center mb-6">
            <img
              src="https://cdn.jrhof.org/events/golf-tournament/2026/golf_tournament_flyer_2026.png"
              alt="Flyer for the 2026 Joe Rossi Hall of Fame Golf Classic event"
              className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl rounded shadow-md"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            <a
              href="https://www.eventbrite.com/e/joe-rossi-hall-of-fame-golf-classic-tickets-1754953445999?utm_source=jrhof_website&utm_medium=button&utm_campaign=golf2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold text-[1.1rem] py-[0.9rem] px-[2rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
            >
              Register Now
            </a>
            <a
              href="https://cdn.jrhof.org/events/golf-tournament/2026/golf_tournament_flyer_2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#0078D7] hover:bg-[#005fa3] text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
            >
              View Flyer (PDF)
            </a>
            <a
              href="https://cdn.jrhof.org/events/golf-tournament/2026/golf_tournament_flyer_2026-1-2.pdf"
              download
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline text-center"
            >
              Download Flyer
            </a>
          </div>
        </div>

        <div className="bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Registration, sponsorship, and event photos will be posted here soon.
          </p>
          <div className="mt-6">
            <Link
              href="/events"
              className="inline-block bg-gray-500 hover:bg-gray-600 text-white font-bold text-[1.1rem] py-[0.9rem] px-[1.75rem] rounded-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition duration-300 ease-in-out hover:translate-y-[-2px] no-underline"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}