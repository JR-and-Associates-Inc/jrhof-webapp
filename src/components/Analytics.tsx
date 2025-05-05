'use client';
import { useEffect } from 'react';

// Declare window dataLayer type
declare global {
  interface Window {
    dataLayer: Array<{ [key: string]: any }>;
  }
}

export default function Analytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    // Google Tag Manager
    (function (w: Window & typeof globalThis, d: Document, s: string, l: string, i: string) {
      // Explicitly type `w[l]` as an array
      (w[l as keyof Window] as unknown as Array<any>) = (w[l as keyof Window] as unknown as Array<any>) || [];
      (w[l as keyof Window] as Array<any>).push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s) as HTMLScriptElement;
      const dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      if (f.parentNode) {
        f.parentNode.insertBefore(j, f);
      }
    })(window, document, 'script', 'dataLayer', 'GTM-NNMQVX3G');
  }, []);

  return (
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-NNMQVX3G"
        height="0"
        width="0"
        className="hidden"
      ></iframe>
    </noscript>
  );
}