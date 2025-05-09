'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPage />
    </Suspense>
  );
}

function SuccessPage() {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    if (paymentId) {
      console.log('Payment ID:', paymentId);
      setPaymentStatus('Payment successful!');
    }
  }, [searchParams]);

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