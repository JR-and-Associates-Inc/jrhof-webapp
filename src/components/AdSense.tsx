'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AdSense = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }
        if (window.adsbygoogle.length === 0) {
          window.adsbygoogle.push({});
        }
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, []);

  return (
    <Script
      id="adsense-script"
      strategy="afterInteractive"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7839480824613721"
      crossOrigin="anonymous"
    />
  );
};

export default AdSense;