# JRHOF Web App

This is the official web application repository for the **Joe Rossi Hall of Fame (JRHOF)** nonprofit organization. Built with [Next.js App Router](https://nextjs.org/docs/app), this site serves as the primary online presence for JRHOF, hosting event information, donation links, honoree biographies, and supporter showcases.

> 🌐 Live site: [https://www.jrhof.org](https://www.jrhof.org)

## Overview

The `jrhof-webapp` repository contains the frontend codebase for the JRHOF website. This application is built with:
- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **Azure Static Web Apps** for deployment
- **Azure Functions** for backend logic (in separate repos)
- **Stripe Checkout** integration for payments
- **Google Tag Manager** with conditional analytics (Google Analytics, Microsoft Clarity)
- **Custom registration and donation flows**

---

## Features

- 🏌️‍♂️ **Event Registration** — Custom flow to register golf tournament participants and raffle ticket purchases
- 💳 **Stripe Integration** — Secure payments with metadata tracking and webhook logging
- 📈 **Analytics + Clarity** — Consent-based analytics integration using GTM and custom cookie banner
- 🧾 **Nonprofit Transparency** — Highlighting JRHOF mission, board, bylaws, and financials
- 🌟 **Honoree Bios** — Clean, classic layouts for showcasing inductees
- 🧰 **Modular Components** — Reusable UI components for headers, footers, navbars, and more
- 🪝 **Webhook Support** — Event data logging and integrations via Azure Functions (external repos)

---

## Architecture

```txt
.
├── app/                 # App Router pages & layouts
│   └── register/        # Custom registration flow
├── components/          # Reusable UI components (Navbar, Footer, Analytics, etc.)
├── public/              # Static assets
├── styles/              # Global styles
├── utils/               # Shared utility functions
├── .env.local           # Environment variables (never committed)
└── ...
```

## Azure & Deployment

This site is deployed via Azure Static Web Apps, connected to GitHub for CI/CD. Backend logic is handled by Azure Functions, each living in its own dedicated repository:
	•	jrhof-func-stripe-checkout — Generates Stripe Checkout sessions
	•	jrhof-func-log-registration — Logs registration form data to Excel/Graph
	•	jrhof-func-stripe-webhook — Handles webhook events and updates the Excel log

---

## Development

Requirements
	•	Node.js 18+
	•	Yarn or npm
	•	VSCode recommended (with ESLint + Prettier plugins)

---

## Getting Started
```
git clone https://github.com/jrhof/jrhof-webapp.git
cd jrhof-webapp
cp .env.local.example .env.local   # Create your local environment file
npm install
npm run dev
```
Then open http://localhost:3000.

---

## Contributing

Contributions are welcome! Please follow our commit conventions and open issues or discussions for feedback before submitting PRs.
	•	Feature branches use the feature/ prefix
	•	Bugfix branches use the fix/ prefix
	•	All PRs must pass CI checks and linting

---

## License

This project is licensed under the MIT License. See LICENSE for details.

---

## Acknowledgments

Special thanks to our board members, volunteers, and supporters. This project is fueled by community passion and a deep commitment to honoring high school umpire legacies—where individuals who have contributed much to the game of baseball in Colorado are honored.
