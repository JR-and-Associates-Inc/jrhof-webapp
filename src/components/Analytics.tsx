'use client';
import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

export default function Analytics({ consentGiven }: { consentGiven: boolean }) {
  useEffect(() => {
    if (!consentGiven || process.env.NODE_ENV !== 'production') return;

    (function (w: Window & typeof globalThis, d: Document, s: string, l: string, i: string) {
      (w[l as keyof Window] as unknown as Array<Record<string, unknown>>) =
        (w[l as keyof Window] as unknown as Array<Record<string, unknown>>) || [];
      (w[l as keyof Window] as Array<Record<string, unknown>>).push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js',
      });

      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s) as HTMLScriptElement;
      const dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      if (f.parentNode) {
        f.parentNode.insertBefore(j, f);
      }
    })(window, document, 'script', 'dataLayer', 'GTM-NNMQVX3G');
  }, [consentGiven]);

  // Optional: Only include noscript fallback if consent is given
  if (!consentGiven) return null;

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