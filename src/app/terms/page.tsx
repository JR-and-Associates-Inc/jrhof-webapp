

export default function TermsPage() {
  return (
    <main className="w-full max-w-screen-lg mx-auto my-6 px-4 sm:px-6 lg:px-8 py-6 bg-white/85 rounded-[12px] shadow-md">
      <h1 className="text-3xl font-bold text-center mb-4">Terms of Use</h1>
      <p className="mb-4">
        Welcome to the website of JR and Associates, Inc. (DBA: Joe Rossi Hall of Fame). By accessing or using this website, you agree to be bound by these Terms of Use. Please read them carefully.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Use of Website</h2>
      <p>
        You may use this website for lawful purposes and in accordance with these terms. You agree not to use the website in any way that could harm, disable, or impair its functionality or interfere with other users’ access.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Intellectual Property</h2>
      <p>
        All content on this site, including text, images, logos, and graphics, is the property of JR and Associates, Inc. unless otherwise noted. You may not use, reproduce, or distribute any content without express written permission.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Links to Third Parties</h2>
      <p>
        Our site may contain links to external websites. We are not responsible for the content or privacy practices of those sites.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Limitation of Liability</h2>
      <p>
        JR and Associates, Inc. is not liable for any damages that result from the use or inability to use this website, including but not limited to indirect or consequential damages.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Changes to Terms</h2>
      <p>
        We may revise these terms at any time by updating this page. Continued use of the site means you accept the updated terms.
      </p>

      <p className="mt-6 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </main>
  );
}