'use client';
import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  }
}

const initializeGTM = (
  w: Window,
  d: Document,
  s: string,
  l: keyof Window | string,
  id: string
): void => {
  const dataLayerName = l as string;

  if (!Array.isArray(w[dataLayerName])) {
    w[dataLayerName] = [];
  }

  (w[dataLayerName] as Array<Record<string, unknown>>).push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const firstScript = d.getElementsByTagName(s)[0];
  const newScript = d.createElement(s) as HTMLScriptElement;
  const dataLayerParam = dataLayerName !== 'dataLayer' ? `&l=${dataLayerName}` : '';
  newScript.async = true;
  newScript.src = `https://www.googletagmanager.com/gtm.js?id=${id}${dataLayerParam}`;

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(newScript, firstScript);
  }
};

export default function Analytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    initializeGTM(window, document, 'script', 'dataLayer', 'GTM-NNMQVX3G');
  }, []);

  return (
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-NNMQVX3G"
        height="0"
        width="0"
        className="hidden"
        title="GTM"
      ></iframe>
    </noscript>
  );
}