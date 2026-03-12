import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { getFeatureConfig } from "@/lib/feature-config";

export default function SharePage() {
  const config = getFeatureConfig();
  const sharedRecordsEnabled = config.features.sharedRecords;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-sky-200/80 uppercase">
            Shared Library Draft
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            공유된 서고 화면 초안
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            현재 프로토타입의 `share.html`을 App Router 화면으로 옮길 때의 기본 상태를
            보여주는 페이지입니다.
          </p>
        </div>
        <StatusChip
          enabled={sharedRecordsEnabled}
          label={sharedRecordsEnabled ? "공유 저장소 사용 가능" : "공유 저장소 미설정"}
        />
      </div>

      <SectionCard
        title={sharedRecordsEnabled ? "다음 단계" : "현재 상태"}
        description={
          sharedRecordsEnabled
            ? "이제 실제 목록 데이터와 작품별 페이지 라우팅을 연결하면 됩니다."
            : "루트 앱과 동일하게, 저장소 설정이 없으면 친절한 안내 화면을 먼저 보여줍니다."
        }
      >
        {sharedRecordsEnabled ? (
          <ul className="space-y-3 text-sm leading-6 text-slate-200">
            <li>공유 책 목록 API를 Route Handler로 이관</li>
            <li>작품별 라우트(`/share/[slug]`) 설계</li>
            <li>책 모달을 서버/클라이언트 컴포넌트 조합으로 분리</li>
          </ul>
        ) : (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-50">
            공유 저장소가 아직 설정되지 않았습니다. `KV_REST_API_URL`과
            `KV_REST_API_TOKEN`을 연결하면 이 화면에서 실제 공유 도서 목록을 불러올 수
            있습니다.
          </div>
        )}
      </SectionCard>

      <Link
        href="/"
        className="w-fit rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
