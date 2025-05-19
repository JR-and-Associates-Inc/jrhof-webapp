'use client';
import { useState, useEffect } from 'react';

const ConsentBanner = ({ setConsentGiven }: { setConsentGiven: (consent: boolean) => void }) => {
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    const cookies = localStorage.getItem('cookieConsent');
    if (cookies) {
      const { accepted } = JSON.parse(cookies);
      if (accepted) {
        setConsentGiven(true);
        setBannerVisible(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({ accepted: true }));
    setConsentGiven(true);
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        analytics_storage: 'granted',
        functionality_storage: 'granted',
        personalization_storage: 'granted',
      });
    }
    setBannerVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({ accepted: false }));
    setConsentGiven(false);
    setBannerVisible(false);
  };

  const handleCustomize = () => {
    // Customize behavior (you can add a modal or any action here)
    console.log('Customize clicked');
  };

  if (!bannerVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 bg-white/90 dark:bg-[#2a2a2a]/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-full max-w-md z-50">
      <div className="flex flex-col items-center space-y-4">
        <p className="text-center text-sm text-gray-800 dark:text-gray-200">
          We use cookies to improve your experience. By using our site, you consent to our use of cookies.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
          <button
            className="bg-black text-white font-bold py-2 px-4 rounded hover:bg-gray-800 dark:hover:bg-gray-600 w-full sm:w-auto"
            onClick={handleAccept}
          >
            Accept All
          </button>
          <button
            className="bg-white text-black font-bold py-2 px-4 rounded border border-black hover:bg-gray-100 dark:bg-gray-100 dark:text-black w-full sm:w-auto"
            onClick={handleDecline}
          >
            Decline
          </button>
          <button
            className="bg-transparent text-black dark:text-white font-bold py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800 w-full sm:w-auto"
            onClick={handleCustomize}
          >
            Customize
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;