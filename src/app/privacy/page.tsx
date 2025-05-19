

export default function PrivacyPage() {
  return (
    <main className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-md text-gray-900 dark:text-gray-300">
      <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">Privacy Policy</h1>
      <p className="mb-4">
        JR and Associates, Inc. (DBA: Joe Rossi Hall of Fame) respects your privacy and is committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and protect the information you provide while using our website.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
      <p>
        We may collect basic personal information such as your name, email address, and message content if you submit a form on our website. We also use tools like Google Analytics and AdSense that may collect non-personal data like browser type, IP address, and user behavior on the site.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Information</h2>
      <p>
        The information we collect is used to improve our website experience, support fundraising and outreach efforts, and deliver personalized content. We do not sell or share your personal information with third parties except as required by law or to support service providers we use (e.g., payment processors).
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Cookies</h2>
      <p>
        Our website uses cookies to provide a better user experience and to serve relevant advertisements through third-party services like Google AdSense. You may opt out of personalized ads through your browser settings or Google’s ad settings page.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Your Consent</h2>
      <p>
        By using our website, you consent to the terms of this Privacy Policy.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Updates</h2>
      <p>
        This policy may be updated occasionally. Changes will be posted on this page with an updated revision date.
      </p>
      <p className="mt-6 text-sm text-muted-foreground dark:text-gray-400">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </main>
  );
}