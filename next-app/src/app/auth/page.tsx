import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { getFeatureConfig } from "@/lib/feature-config";

const rolloutSteps = [
  "1차: 이메일 매직링크 또는 OTP 로그인 활성화",
  "2차: Google 로그인 추가",
  "3차: 익명 기록과 계정 기록 병합 플로우 연결",
  "4차: 카카오는 한국 전용 보조 로그인으로 축소",
];

export default function AuthPage() {
  const config = getFeatureConfig();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-sky-200/80 uppercase">
            Auth Migration
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            이메일 · Google 중심 로그인 구조
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            현재 카카오 전용 공유 로그인 흐름을 국제 확장 가능한 구조로 바꾸기 위한
            이관 화면입니다. 실제 인증 라이브러리를 붙이기 전, 어떤 제공자가 준비됐는지와
            롤아웃 순서를 한 화면에서 확인할 수 있습니다.
          </p>
        </div>
        <Link
          href="/migration"
          className="w-fit rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          이관 로드맵 보기
        </Link>
      </div>

      <SectionCard
        title="현재 준비 상태"
        description="환경변수 기준으로 어떤 로그인 수단이 준비됐는지 보여줍니다."
      >
        <div className="flex flex-wrap gap-3">
          <StatusChip
            enabled={config.auth.email}
            label={config.auth.email ? "이메일 로그인 준비됨" : "이메일 로그인 미설정"}
          />
          <StatusChip
            enabled={config.auth.google}
            label={config.auth.google ? "Google 로그인 준비됨" : "Google 로그인 미설정"}
          />
          <StatusChip
            enabled={config.auth.kakao}
            label={config.auth.kakao ? "카카오 로그인 준비됨" : "카카오 로그인 미설정"}
          />
        </div>
      </SectionCard>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard
          title="권장 순서"
          description="해외 확장을 고려한 기준으로 가장 안정적인 단계별 인증 전략입니다."
        >
          <ul className="space-y-3 text-sm leading-6 text-slate-200">
            {rolloutSteps.map((step) => (
              <li key={step} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-sky-300" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="환경변수"
          description="이 페이지에서 활성 상태를 바꾸는 최소 설정값입니다."
        >
          <ul className="space-y-3 text-sm leading-6 text-slate-200">
            <li>`AUTH_EMAIL_ENABLED=1`</li>
            <li>`GOOGLE_CLIENT_ID=...`</li>
            <li>`GOOGLE_CLIENT_SECRET=...`</li>
            <li>`KAKAO_JS_KEY=...` / `KAKAO_REST_API_KEY=...`</li>
          </ul>
        </SectionCard>
      </div>
    </main>
  );
}
