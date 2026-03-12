This is the App Router migration starter for MagicHouse.

## Getting Started

1. Copy `.env.example` to `.env.local`
2. Install dependencies
3. Run the development server

`AD_BANNER_*` 값을 채우면 메인 화면에 직접 만든 프로모션 배너가 노출됩니다.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to see the scaffold.

## Available routes

- `/` – migration landing page
- `/auth` – 이메일/Google 중심 인증 이관 페이지
- `/migration` – phased migration checklist
- `/lab` – TMDB 검색 / AI 질문 생성 실험실
- `/share` – shared library placeholder
- `/api/config` – feature availability JSON for server/client UI gating
- `/api/tmdb/search` – Next Route Handler 기반 TMDB 검색
- `/api/generate-questions` – Next Route Handler 기반 AI 질문 생성

## Validation

```bash
npm run lint
npm run build
```

## Notes

- This folder is intentionally separate from the current HTML + Express app.
- Migrate route-by-route instead of replacing the prototype in one step.
