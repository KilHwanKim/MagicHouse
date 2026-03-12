import Link from "next/link";
import { MigrationLab } from "@/components/migration-lab";
import { SectionCard } from "@/components/section-card";
import { getFeatureConfig } from "@/lib/feature-config";

export default function LabPage() {
  const config = getFeatureConfig();

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-10 md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-sky-200/80 uppercase">
            Migration Lab
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Next.js 이식 실험실
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            TODO 상 우선순위였던 TMDB 검색과 AI 질문 생성을 Next.js Route Handler로 실제
            옮긴 뒤, 바로 이 페이지에서 검증할 수 있도록 만들었습니다.
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
        title="실험 상태"
        description="환경변수가 없으면 각 단계에서 친절한 메시지를 보여주고, 키를 넣으면 같은 화면에서 실제 API를 검증할 수 있습니다."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            TMDB 검색: {config.features.tmdbSearch ? "사용 가능" : "미설정"}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            AI 질문 생성: {config.features.aiQuestions ? "사용 가능" : "미설정"}
          </div>
        </div>
      </SectionCard>

      <MigrationLab features={config.features} />
    </main>
  );
}
