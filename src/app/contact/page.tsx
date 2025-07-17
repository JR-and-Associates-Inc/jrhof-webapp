'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pushToDataLayer, fireCustomEvent } from '@/types/analytics';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();

    const payload = { name, email, message };

    try {
      const res = await fetch('https://jrhof-contact-worker.tmco-consulting.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus('sent');
        form.reset();

        // --- Unified analytics hooks (CTM-driven) ---
        pushToDataLayer({
          event: 'contact_form_submitted',
          form_location: 'contact_page',
          form_name: name,
          form_email: email,
        });

        fireCustomEvent('jrhof_contact_form_submitted', {
          location: 'contact_page',
          name,
          email,
        });
        // -------------------------------------------

        router.push('/thanks');
      } else {
        setStatus('error');

        pushToDataLayer({
          event: 'contact_form_error',
          form_location: 'contact_page',
          status: res.status,
        });

        fireCustomEvent('jrhof_contact_form_error', {
          location: 'contact_page',
          status: res.status,
        });
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setStatus('error');

      pushToDataLayer({
        event: 'contact_form_error',
        form_location: 'contact_page',
        error: 'network_or_exception',
      });

      fireCustomEvent('jrhof_contact_form_error', {
        location: 'contact_page',
        error: 'network_or_exception',
      });
    }
  };

  return (
      <div className="w-full max-w-screen-md mx-auto my-8 px-4 py-6 bg-white/90 dark:bg-[#2a2a2a]/90 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
                type="text"
                name="name"
                required
                placeholder="Your Name"
                className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Message</label>
            <textarea
                name="message"
                rows={5}
                required
                placeholder="Your message..."
                className="w-full border border-gray-300 rounded px-4 py-2"
            ></textarea>
          </div>

          <button
              type="submit"
              className="w-full bg-[#0078D7] text-white py-2 rounded font-bold hover:bg-[#005fa3] transition"
              disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {status === 'sent' && (
              <p className="text-green-600 font-semibold text-center">Message sent! We&apos;ll be in touch soon.</p>
          )}
          {status === 'error' && (
              <p className="text-red-600 font-semibold text-center">Something went wrong. Please try again.</p>
          )}
        </form>
      </div>
  );
}
