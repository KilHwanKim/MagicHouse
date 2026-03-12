import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { getFeatureConfig } from "@/lib/feature-config";

const migrationSteps = [
  {
    title: "1. 공개 페이지 분리",
    body: "작품 소개, 공유 링크, OG 이미지가 필요한 화면부터 App Router로 옮깁니다.",
  },
  {
    title: "2. 서버 데이터 모델 전환",
    body: "title 문자열 중심 저장을 작품 ID, 질문, 답변, 사용자 중심 구조로 재설계합니다.",
  },
  {
    title: "3. 계정과 결제 연결",
    body: "클라우드 동기화, 결제, 운영 지표를 같은 Next 앱 안에서 관리합니다.",
  },
];

const featureDescriptions = [
  ["tmdbSearch", "TMDB 검색"],
  ["aiQuestions", "AI 질문 생성"],
  ["kakaoShare", "카카오 공유"],
  ["kakaoLogin", "카카오 로그인"],
  ["sharedRecords", "공유 서고 저장"],
] as const;

export default function Home() {
  const config = getFeatureConfig();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 md:px-10">
      <section className="overflow-hidden rounded-[2rem] border border-sky-400/20 bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-sky-950/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-sky-200/80 uppercase">
              Next.js Migration Starter
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              마법사의 서고를
              <span className="block text-sky-300">Next.js App Router 구조로 옮기기 위한 출발점</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200/90 md:text-lg">
              현재 HTML + Express 프로토타입을 유지하면서, 공개 페이지·설정 API·마이그레이션
              문서를 분리한 초기 골격입니다. 이후 작품 페이지, 공유 페이지, 로그인, 결제를
              이 폴더 기준으로 점진 이관할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/migration"
              className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              이관 계획 보기
            </Link>
            <Link
              href="/share"
              className="rounded-full border border-sky-300/30 bg-sky-400/15 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20"
            >
              공유 서고 화면 초안
            </Link>
            <Link
              href="/lab"
              className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20"
            >
              API 실험실
            </Link>
          </div>
        </div>
      </section>

      {config.promotion ? (
        <SectionCard
          title={config.promotion.label}
          description="현재 앱과 동일한 개념의 프로모션 배너입니다. 환경변수만 채우면 노출됩니다."
        >
          <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-r from-amber-300/10 via-orange-300/10 to-transparent p-6">
            <h2 className="text-2xl font-semibold text-amber-50">
              {config.promotion.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-amber-50/85">
              {config.promotion.body}
            </p>
            <a
              href={config.promotion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-full border border-amber-300/25 bg-amber-300/15 px-5 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/20"
            >
              {config.promotion.cta}
            </a>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="왜 Next.js 구조를 먼저 까는가"
          description="지금 서비스가 사업화 단계로 가기 위해 꼭 필요한 SEO, 공유 링크, 서버 데이터, 인증 확장을 염두에 둔 최소 골격입니다."
        >
          <ul className="space-y-4 text-sm leading-6 text-slate-200">
            <li>공개 공유 페이지와 개인화 페이지를 같은 앱에서 나눠 관리할 수 있습니다.</li>
            <li>Route Handler로 현재 Express API를 점진적으로 옮길 수 있습니다.</li>
            <li>App Router 기준으로 SEO, 메타데이터, OG 이미지 대응이 쉬워집니다.</li>
            <li>로그인, 결제, 분석 이벤트를 한 프로젝트 안에서 통합하기 좋습니다.</li>
          </ul>
        </SectionCard>

        <SectionCard
          title="현재 기능 상태"
          description="루트 앱과 비슷한 환경변수를 넣으면 이 상태가 자동으로 바뀝니다."
        >
          <div className="flex flex-wrap gap-3">
            {featureDescriptions.map(([key, label]) => (
              <StatusChip
                key={key}
                enabled={config.features[key]}
                label={`${label} ${config.features[key] ? "사용 가능" : "미설정"}`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-400">
            `KAKAO_JS_KEY`는 공유 UI, `KAKAO_REST_API_KEY`는 로그인, `KV_REST_API_URL`과
            `KV_REST_API_TOKEN`은 공유 서고를 켜는 기준으로 사용됩니다.
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="이관 순서"
        description="현재 프로토타입을 깨지 않으면서 Next.js 쪽으로 조금씩 기능을 이동시키는 권장 흐름입니다."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {migrationSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-slate-950/30 p-5"
            >
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{step.body}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </main>
  );
}
