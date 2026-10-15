# Aivarnix website

The public marketing site for Aivarnix ("AI Interviews for a Brighter Tomorrow"). It is a
separate React + Vite + Tailwind project inside `interview-front/`, next to the Expo app,
which it does not touch. Sign-in, sign-up and interviews happen in the Aivarnix app (the Expo
web build), which uses the existing `interview-back` API; the website links to it.

## Commands

Run from `interview-front/website`:

```bash
npm install        # once
npm run dev        # http://localhost:5175
npm run build      # type-check, then production build into dist/
npm run preview    # serve the production build on http://localhost:5175
```

## Configuration

Copy `.env.example` to `.env` (values are read at build time):

| Variable | Meaning |
| --- | --- |
| `VITE_APP_URL` | The Aivarnix app that Login, Get Started and Start Free Interview open. Default: `https://12-10-26-interview-front.vercel.app` |
| `VITE_CONTACT_EMAIL` | Optional. Shown in the footer and on paid plans only when set |
| `VITE_TERMS_URL` | Optional. Until set, the footer marks Terms of Service as coming soon |

## Deploying (Vercel)

Create a second Vercel project from the same repository with **Root Directory**
`interview-front/website`, framework **Vite**, build `npm run build`, output `dist`. Set the
variables above under Environment Variables. The existing app project is unaffected.

## Content rules

- Feature text describes only what the platform does today.
- Previews of the interview room and the report are marked "Demo preview · sample content".
- Paid plans show "Coming soon" with no prices until pricing exists in the platform.

## Structure

```
website/
  index.html            page shell, title, meta, favicon
  public/               favicon and brand images (copies of interview-front/assets/brand)
  src/
    config.ts           app links and optional contact / terms
    index.css           Tailwind and the Aivarnix design tokens
    App.tsx             page order
    components/         Navbar, Hero, Features (+ How it works), Previews,
                        Business (companies + pricing), Footer (+ final CTA), ui (shared)
```
