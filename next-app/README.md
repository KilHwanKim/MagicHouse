This is the App Router migration starter for MagicHouse.

## Getting Started

1. Copy `.env.example` to `.env.local`
2. Install dependencies
3. Run the development server

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to see the scaffold.

## Available routes

- `/` – migration landing page
- `/migration` – phased migration checklist
- `/share` – shared library placeholder
- `/api/config` – feature availability JSON for server/client UI gating

## Validation

```bash
npm run lint
npm run build
```

## Notes

- This folder is intentionally separate from the current HTML + Express app.
- Migrate route-by-route instead of replacing the prototype in one step.
