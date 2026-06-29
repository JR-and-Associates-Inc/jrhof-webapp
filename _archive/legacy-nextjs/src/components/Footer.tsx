import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="mt-auto bg-black text-white text-center py-4 text-sm">
      <div className="text-sm text-center text-white mb-2">
        The Joe Rossi Umpires Hall of Fame is supported by CHSBUA and community partners |{' '}
        <a
          href="https://www.chsbua.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Visit CHSBUA.com
        </a>
      </div>
      <p>
        &copy; {new Date().getFullYear()} Joe Rossi Umpires Hall of Fame is the public-facing program of JR and Associates, Inc., a Colorado 501(c)(3) nonprofit organization.
      </p>
      <p>
        Website Stewardship by{' '}
        <a
          href="https://www.tmcoconsulting.com"
          rel="noopener noreferrer"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          TMCO Consulting
        </a>
        {' \u26BE\uFE0F'}
      </p>
      <p className="mt-2 text-sm text-center">
        <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>{' '}
        | <Link href="/terms" className="text-blue-400 hover:underline">Terms of Use</Link>
      </p>
    </footer>
  );
};

export default Footer;
