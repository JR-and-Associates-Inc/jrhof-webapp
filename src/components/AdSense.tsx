'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const AdSense = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Check if adsbygoogle is already populated with ads
        if (window.adsbygoogle && window.adsbygoogle.length === 0) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
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