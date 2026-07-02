# Security Policy

Thank you for helping protect the Joe Rossi Umpires Hall of Fame website.

## Report a vulnerability

Do not open a public issue or disclose the problem publicly before it is reviewed. Email the public security contact at `contact@jrhof.org` with:

- the affected URL, file, or component;
- steps to reproduce and the observed impact;
- any relevant request/response details with secrets and personal data removed; and
- a safe way to contact you for follow-up.

Do not include credentials, private keys, payment data, or unnecessary personal information. Do not test by disrupting service, accessing another person's data, submitting live payments, or changing Cloudflare, Stripe, Google, or other third-party account state.

## Scope

This policy covers:

- `https://jrhof.org`;
- this repository: `https://github.com/JR-and-Associates-Inc/jrhof-webapp`; and
- JRHOF-owned code or endpoints that may be added to the production Worker.

Third-party services are governed by their own vulnerability-disclosure programs. A configuration problem affecting JRHOF's use of a third-party service may still be reported to the address above.

Only the current production site and the supported `main` branch receive fixes. Archived code under `_archive/` is retained for history and is not a supported deployment.

## Handling

Reports are reviewed through the organization's current response process. Response and remediation timing depends on severity, reproducibility, volunteer availability, and third-party coordination. The organization may request additional information and will coordinate responsible disclosure when practical.

The machine-readable policy is published at `https://jrhof.org/.well-known/security.txt`.
