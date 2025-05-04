'use client';
import { useEffect } from 'react';

// Declare window dataLayer type
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export default function Analytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-YKM55KNBRM';
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];

    // Update gtag function with proper typing
    function gtag(...args: [Record<string, unknown>]) {
      window.dataLayer.push(...args);
    }

    gtag({ event: 'js', 'js_date': new Date() });
    gtag({ event: 'config', config_id: 'G-YKM55KNBRM' });
  }, []);

  return null;
}