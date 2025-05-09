'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // Import for client-side use
import Link from 'next/link';

export default function SuccessPage() {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // State to check if client-side
  const router = useRouter();

  // Set isClient to true once the component is mounted on the client
  useEffect(() => {
    setIsClient(true); // This runs only on the client side
  }, []);

  useEffect(() => {
    if (isClient && router.query.payment_id) { // Ensure this runs only on the client
      console.log('Payment ID:', router.query.payment_id);
      setPaymentStatus('Payment successful!');
    }
  }, [router.query.payment_id, isClient]);

  if (!isClient) return null; // Avoid rendering before client-side hydration

  return (
    <main className="w-full max-w-screen-md mx-auto mt-10 px-6 py-10 bg-green-100 border border-green-300 rounded text-green-800 text-center shadow-md">
      <h1 className="text-2xl font-bold mb-4">✅ Thank you for registering!</h1>
      <p className="mb-4">
        Your payment was successful and your spot is confirmed for<br />
        <strong>The Umpire’s Cup III – June 28, 2025</strong>
      </p>
      {paymentStatus && <p className="mb-4 text-lg font-semibold">{paymentStatus}</p>}
      <p className="mb-6">Check your email for a receipt and event details.</p>
      <Link href="/" className="text-blue-700 underline hover:text-blue-900">
        Return to Homepage
      </Link>
    </main>
  );
}