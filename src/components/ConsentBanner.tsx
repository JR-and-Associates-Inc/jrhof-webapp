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
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 bg-white/90 border border-gray-200 rounded-lg shadow-lg p-3 w-full max-w-md z-50">
      <div className="flex flex-col items-center space-y-4">
        <p className="text-center text-sm">
          We use cookies to improve your experience. By using our site, you consent to our use of cookies.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            className="bg-black text-white font-bold py-2 px-4 rounded hover:bg-gray-700"
            onClick={handleAccept}
          >
            Accept All
          </button>
          <button
            className="bg-white text-black font-bold py-2 px-4 rounded border border-black hover:bg-gray-100"
            onClick={handleDecline}
          >
            Decline
          </button>
          <button
            className="bg-transparent text-black font-bold py-2 px-4 rounded hover:bg-gray-100"
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