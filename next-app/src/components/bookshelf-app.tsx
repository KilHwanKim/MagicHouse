"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FeatureConfig } from "@/lib/feature-config";
import {
  buildWorkKey,
  createDefaultQuestion,
  createDemoLibraryState,
  NEXT_LIBRARY_STORAGE_KEY,
  type LibraryState,
  type QuestionRecord,
  type WorkMetadata,
} from "@/lib/bookshelf";

type SearchResult = {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
};

type BookshelfAppProps = {
  config: FeatureConfig;
};

const emptyLibraryState: LibraryState = {
  archiveData: {},
  workMetadata: {},
  storageVersion: 2,
};

export function BookshelfApp({ config }: BookshelfAppProps) {
  const [libraryState, setLibraryState] = useState<LibraryState>(emptyLibraryState);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("작품을 검색하거나 데모 서고를 둘러보세요.");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [openWorkKey, setOpenWorkKey] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionStatus, setQuestionStatus] = useState("질문을 고르거나 AI 질문을 생성해 보세요.");

  useEffect(() => {
    const raw = window.localStorage.getItem(NEXT_LIBRARY_STORAGE_KEY);
    if (!raw) {
      const demo = createDemoLibraryState();
      setLibraryState(demo);
      window.localStorage.setItem(NEXT_LIBRARY_STORAGE_KEY, JSON.stringify(demo));
      return;
    }

    try {
      const parsed = JSON.parse(raw) as LibraryState;
      if (parsed?.archiveData && parsed?.workMetadata) {
        setLibraryState(parsed);
      } else {
        const demo = createDemoLibraryState();
        setLibraryState(demo);
        window.localStorage.setItem(NEXT_LIBRARY_STORAGE_KEY, JSON.stringify(demo));
      }
    } catch {
      const demo = createDemoLibraryState();
      setLibraryState(demo);
      window.localStorage.setItem(NEXT_LIBRARY_STORAGE_KEY, JSON.stringify(demo));
    }
  }, []);

  useEffect(() => {
    if (libraryState !== emptyLibraryState) {
      window.localStorage.setItem(NEXT_LIBRARY_STORAGE_KEY, JSON.stringify(libraryState));
    }
  }, [libraryState]);

  const works = useMemo(
    () => Object.keys(libraryState.archiveData).map((workKey) => libraryState.archiveData[workKey]),
    [libraryState],
  );

  const openWork = openWorkKey ? libraryState.archiveData[openWorkKey] : null;
  const openMetadata = openWorkKey ? libraryState.workMetadata[openWorkKey] : null;
  const openQuestion = openWork?.questions[currentQuestionIndex] || null;

  useEffect(() => {
    if (openQuestion) {
      setDraftAnswer(openQuestion.a || "");
    } else {
      setDraftAnswer("");
    }
  }, [openQuestion]);

  function upsertWork(metadata: WorkMetadata, questions?: QuestionRecord[]) {
    setLibraryState((prev) => {
      const existing = prev.archiveData[metadata.workKey];
      return {
        ...prev,
        archiveData: {
          ...prev.archiveData,
          [metadata.workKey]: existing || {
            workKey: metadata.workKey,
            title: metadata.title,
            questions: questions?.length ? questions : [createDefaultQuestion(metadata.title)],
          },
        },
        workMetadata: {
          ...prev.workMetadata,
          [metadata.workKey]: metadata,
        },
      };
    });
  }

  function loadDemoLibrary() {
    const demo = createDemoLibraryState();
    setLibraryState(demo);
    setQuestionStatus("데모 서고를 불러왔습니다.");
  }

  async function handleSearch() {
    if (!config.features.tmdbSearch) {
      setSearchStatus("TMDB API 키가 없어 검색 대신 데모 서고를 사용하세요.");
      return;
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchStatus("검색어를 입력하세요.");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSearchStatus("작품을 찾는 중...");

    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "검색 실패");
      }

      const results = Array.isArray(data.results) ? data.results : [];
      setSearchResults(results);
      setSearchStatus(results.length ? `${results.length}개의 결과를 찾았습니다.` : "검색 결과가 없습니다.");
    } catch (error) {
      setSearchStatus(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      setIsSearching(false);
    }
  }

  function selectSearchResult(result: SearchResult) {
    const title = result.title || result.name || "제목 없음";
    const workKey = buildWorkKey({
      workId: String(result.id || ""),
      mediaType: result.media_type || "unknown",
      title,
    });

    upsertWork({
      workKey,
      title,
      overview: result.overview || "",
      mediaType: result.media_type || "unknown",
      workId: String(result.id || ""),
      posterPath: result.poster_path || "",
      releaseDate: result.release_date || result.first_air_date || "",
    });

    setOpenWorkKey(workKey);
    setCurrentQuestionIndex(0);
    setIsSearchOpen(false);
    setQuestionStatus("작품을 추가했습니다.");
  }

  function saveCurrentAnswer() {
    if (!openWorkKey || !openWork) return;

    setLibraryState((prev) => {
      const nextQuestions = [...prev.archiveData[openWorkKey].questions];
      nextQuestions[currentQuestionIndex] = {
        ...nextQuestions[currentQuestionIndex],
        a: draftAnswer,
      };

      return {
        ...prev,
        archiveData: {
          ...prev.archiveData,
          [openWorkKey]: {
            ...prev.archiveData[openWorkKey],
            questions: nextQuestions,
          },
        },
      };
    });
  }

  function addManualQuestion() {
    if (!openWorkKey || !openWork) return;

    const text = window.prompt("추가할 질문을 입력하세요.");
    if (!text?.trim()) return;

    setLibraryState((prev) => {
      const nextQuestions = [
        ...prev.archiveData[openWorkKey].questions,
        { q: text.trim(), a: "" },
      ];
      return {
        ...prev,
        archiveData: {
          ...prev.archiveData,
          [openWorkKey]: {
            ...prev.archiveData[openWorkKey],
            questions: nextQuestions,
          },
        },
      };
    });
    setCurrentQuestionIndex(openWork.questions.length);
    setQuestionStatus("직접 질문을 추가했습니다.");
  }

  async function generateQuestions() {
    if (!openWorkKey || !openMetadata) return;
    if (!config.features.aiQuestions) {
      setQuestionStatus("OPENAI_API_KEY가 없어 데모 데이터로만 확인할 수 있습니다.");
      return;
    }
    if (!openMetadata.overview?.trim()) {
      setQuestionStatus("줄거리 정보가 없어 질문을 생성할 수 없습니다.");
      return;
    }

    setIsGenerating(true);
    setQuestionStatus("AI가 새 질문을 만드는 중...");

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: openMetadata.title,
          overview: openMetadata.overview,
          existingQA: openWork?.questions.map((item) => ({ q: item.q, a: item.a })) || [],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "질문 생성 실패");
      }

      const nextQuestions = Array.isArray(data.questions) ? data.questions : [];
      if (!nextQuestions.length) {
        throw new Error("생성된 질문이 없습니다.");
      }

      setLibraryState((prev) => ({
        ...prev,
        archiveData: {
          ...prev.archiveData,
          [openWorkKey]: {
            ...prev.archiveData[openWorkKey],
            questions: [
              ...prev.archiveData[openWorkKey].questions.filter(
                (item) => item.q !== createDefaultQuestion(openMetadata.title).q,
              ),
              ...nextQuestions.map((item: { q?: string; options?: string[] } | string) =>
                typeof item === "string"
                  ? { q: item, a: "" }
                  : { q: item.q || "", a: "", options: item.options },
              ),
            ],
          },
        },
      }));
      setCurrentQuestionIndex(Math.max((openWork?.questions.length || 1) - 1, 0));
      setQuestionStatus(`${nextQuestions.length}개의 질문을 생성했습니다.`);
    } catch (error) {
      setQuestionStatus(error instanceof Error ? error.message : "질문 생성 실패");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 md:px-10">
      <section className="overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0f172a] p-8 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-amber-200/80 uppercase">
              Arcane Library
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Next.js 서고 UI 이식판
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              이제 Next.js 홈에서 실제 책장형 UI를 볼 수 있습니다. TMDB 키가 없더라도 데모
              서고를 바로 볼 수 있고, 키가 있으면 검색과 AI 질문 생성도 같은 화면에서
              확인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="rounded-full border border-amber-300/30 bg-amber-400/15 px-5 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-400/20 disabled:opacity-50"
              disabled={!config.features.tmdbSearch}
              title={
                config.features.tmdbSearch
                  ? "작품 검색"
                  : "TMDB 키가 없어 검색 대신 데모 서고를 사용하세요."
              }
            >
              작품 검색
            </button>
            <button
              type="button"
              onClick={loadDemoLibrary}
              className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              데모 서고 채우기
            </button>
            <Link
              href={config.feedbackFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              피드백 보내기
            </Link>
          </div>
        </div>
      </section>

      {config.promotion ? (
        <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-r from-amber-300/10 via-orange-300/10 to-transparent p-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-amber-200 uppercase">
            {config.promotion.label}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-amber-50">
            {config.promotion.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-amber-50/85">
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
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">서고</h2>
            <p className="mt-2 text-sm text-slate-400">
              책을 클릭하면 질문과 답변을 볼 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/lab"
              className="rounded-full border border-emerald-300/25 bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20"
            >
              API 실험실
            </Link>
            <Link
              href="/migration"
              className="rounded-full border border-sky-300/25 bg-sky-400/15 px-4 py-2 text-sm font-semibold text-sky-50 transition hover:bg-sky-400/20"
            >
              이관 로드맵
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          {[0, 1, 2].map((rowIndex) => {
            const rowWorks = works.slice(rowIndex * 4, rowIndex * 4 + 4);
            return (
              <div key={rowIndex} className="rounded-3xl border border-white/6 bg-slate-950/30 p-5">
                <div className="flex min-h-[220px] items-end gap-4 overflow-x-auto">
                  {rowWorks.map((work) => (
                    <button
                      key={work.workKey}
                      type="button"
                      onClick={() => {
                        setOpenWorkKey(work.workKey);
                        setCurrentQuestionIndex(0);
                        setQuestionStatus("질문을 확인하거나 새 질문을 생성해 보세요.");
                      }}
                      className="flex h-[190px] min-w-[72px] max-w-[92px] flex-none items-center justify-center rounded-[10px] border border-black/20 px-3 py-4 text-center text-sm font-semibold text-white shadow-2xl shadow-black/30 transition hover:-translate-y-2 hover:brightness-110"
                      style={{
                        background: rowIndex % 2 === 0 ? "#4e1a1a" : "#1a2b4a",
                        width: `${72 + work.questions.length * 8}px`,
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                      }}
                    >
                      {work.title}
                    </button>
                  ))}

                  {!rowWorks.length ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-sm text-slate-400">
                      이 선반은 아직 비어 있습니다.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {isSearchOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#101826] p-6 shadow-2xl shadow-black/40">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">작품 검색</h2>
                <p className="mt-1 text-sm text-slate-400">
                  TMDB 키가 있으면 실제 검색 결과를 불러옵니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                닫기
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="작품명 검색"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="rounded-2xl border border-sky-300/25 bg-sky-400/15 px-5 py-3 text-sm font-semibold text-sky-50 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearching ? "검색 중..." : "검색"}
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-400">{searchStatus}</p>

            <div className="mt-5 max-h-[50vh] space-y-3 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={`${result.media_type}-${result.id}`}
                  type="button"
                  onClick={() => selectSearchResult(result)}
                  className="block w-full rounded-2xl border border-white/8 bg-white/5 p-4 text-left transition hover:bg-white/8"
                >
                  <div className="font-semibold text-white">
                    {result.title || result.name || "제목 없음"}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {result.media_type || "unknown"}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {result.overview || "줄거리 정보가 없습니다."}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {openWork && openMetadata ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6">
          <div className="grid w-full max-w-6xl gap-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#eadfc8] text-[#36241a] shadow-2xl shadow-black/40 lg:grid-cols-2">
            <div className="border-b border-[#36241a]/10 p-8 lg:border-b-0 lg:border-r">
              <h2 className="text-3xl font-semibold">{openMetadata.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#5b463e]">
                {openQuestion?.q || "질문이 없습니다."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((value) => Math.max(value - 1, 0))}
                  className="rounded-full border border-[#36241a]/20 px-4 py-2 text-sm"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIndex((value) =>
                      Math.min(value + 1, Math.max(openWork.questions.length - 1, 0)),
                    )
                  }
                  className="rounded-full border border-[#36241a]/20 px-4 py-2 text-sm"
                >
                  다음
                </button>
                <span className="inline-flex items-center text-xs text-[#5b463e]">
                  {openWork.questions.length ? `${currentQuestionIndex + 1} / ${openWork.questions.length}` : "0 / 0"}
                </span>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addManualQuestion}
                  className="rounded-full border border-amber-700/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-[#5b463e]"
                >
                  질문 직접 추가
                </button>
                <button
                  type="button"
                  onClick={generateQuestions}
                  disabled={isGenerating}
                  className="rounded-full border border-emerald-700/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-[#355846] disabled:opacity-50"
                >
                  {isGenerating ? "생성 중..." : "AI 질문 생성"}
                </button>
              </div>
              <p className="mt-4 text-sm text-[#7c655b]">{questionStatus}</p>
            </div>

            <div className="p-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">답변</h3>
                <button
                  type="button"
                  onClick={() => {
                    saveCurrentAnswer();
                    setOpenWorkKey("");
                  }}
                  className="rounded-full border border-[#36241a]/20 px-4 py-2 text-sm"
                >
                  저장하고 닫기
                </button>
              </div>
              <textarea
                value={draftAnswer}
                onChange={(event) => setDraftAnswer(event.target.value)}
                className="min-h-[320px] w-full rounded-[1.5rem] border border-[#36241a]/10 bg-white/60 p-5 text-sm leading-7 text-[#36241a] outline-none"
                placeholder="당신의 감상과 생각을 이곳에 남겨보세요."
              />
              {openMetadata.overview ? (
                <div className="mt-5 rounded-2xl border border-[#36241a]/10 bg-white/40 p-4">
                  <div className="text-xs font-semibold tracking-[0.2em] text-[#7c655b] uppercase">
                    줄거리 메모
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5b463e]">{openMetadata.overview}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
