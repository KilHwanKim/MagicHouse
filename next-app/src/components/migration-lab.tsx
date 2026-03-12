"use client";

import { useMemo, useState } from "react";
import type { FeatureFlags } from "@/lib/feature-config";

type SearchResult = {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  overview?: string;
};

type GeneratedQuestion = {
  q: string;
  options?: string[];
};

type MigrationLabProps = {
  features: FeatureFlags;
};

export function MigrationLab({ features }: MigrationLabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("환경설정을 확인한 뒤 검색을 시도하세요.");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedWork, setSelectedWork] = useState<SearchResult | null>(null);
  const [questionStatus, setQuestionStatus] = useState("작품을 선택하면 AI 질문 생성 실험을 할 수 있습니다.");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = useMemo(
    () => features.aiQuestions && Boolean(selectedWork?.overview?.trim()),
    [features.aiQuestions, selectedWork],
  );

  async function handleSearch() {
    if (!features.tmdbSearch) {
      setSearchStatus("TMDB API 키가 없어 Next.js 검색 실험을 사용할 수 없습니다.");
      return;
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchStatus("검색어를 입력하세요.");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedWork(null);
    setQuestions([]);
    setSearchStatus("Next.js Route Handler로 TMDB 검색 중...");

    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(trimmed)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "검색 실패");
      }

      const results = Array.isArray(data.results) ? data.results : [];
      setSearchResults(results);
      setSearchStatus(results.length > 0 ? `${results.length}개의 결과를 찾았습니다.` : "검색 결과가 없습니다.");
    } catch (error) {
      setSearchStatus(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleGenerate() {
    if (!selectedWork) {
      setQuestionStatus("먼저 작품을 선택하세요.");
      return;
    }

    if (!features.aiQuestions) {
      setQuestionStatus("OPENAI_API_KEY가 없어 AI 질문 생성 실험을 사용할 수 없습니다.");
      return;
    }

    const overview = selectedWork.overview?.trim();
    if (!overview) {
      setQuestionStatus("선택한 작품에 줄거리가 없어 질문을 생성할 수 없습니다.");
      return;
    }

    setIsGenerating(true);
    setQuestions([]);
    setQuestionStatus("Next.js Route Handler로 AI 질문 생성 중...");

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedWork.title || selectedWork.name || "제목 없음",
          overview,
          existingQA: [],
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "질문 생성 실패");
      }

      const nextQuestions = Array.isArray(data.questions) ? data.questions : [];
      setQuestions(nextQuestions);
      setQuestionStatus(nextQuestions.length > 0 ? `${nextQuestions.length}개의 질문을 생성했습니다.` : "생성된 질문이 없습니다.");
    } catch (error) {
      setQuestionStatus(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white">TMDB 검색 실험</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            현재 Next.js Route Handler가 실제로 동작하는지 검색부터 확인하는 영역입니다.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="예: 스즈메의 문단속"
            className="flex-1 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
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
        <p className="mt-3 text-sm text-slate-400">{searchStatus}</p>

        <div className="mt-5 space-y-3">
          {searchResults.slice(0, 5).map((result) => {
            const title = result.title || result.name || "제목 없음";
            const selected = selectedWork?.id === result.id;

            return (
              <button
                key={`${result.media_type}-${result.id}`}
                type="button"
                onClick={() => {
                  setSelectedWork(result);
                  setQuestionStatus("선택된 작품으로 AI 질문 생성 실험을 할 수 있습니다.");
                }}
                className={`block w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-sky-300/40 bg-sky-400/10"
                    : "border-white/8 bg-white/5 hover:bg-white/8"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-white">{title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {result.media_type || "unknown"}
                    </div>
                  </div>
                  {selected ? (
                    <span className="rounded-full bg-sky-300/15 px-3 py-1 text-xs font-semibold text-sky-100">
                      선택됨
                    </span>
                  ) : null}
                </div>
                {result.overview ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                    {result.overview}
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    줄거리 정보가 없습니다.
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white">AI 질문 생성 실험</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            선택한 작품의 줄거리로 `POST /api/generate-questions`를 호출합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className="rounded-2xl border border-emerald-300/25 bg-emerald-400/15 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "질문 생성 중..." : "AI 질문 생성"}
        </button>
        <p className="mt-3 text-sm text-slate-400">{questionStatus}</p>

        <div className="mt-5 space-y-3">
          {questions.map((question, index) => (
            <div
              key={`${question.q}-${index}`}
              className="rounded-2xl border border-white/8 bg-white/5 p-4"
            >
              <div className="text-sm font-semibold text-white">
                Q{index + 1}. {question.q}
              </div>
              {question.options?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {question.options.map((option) => (
                    <li key={option} className="rounded-xl bg-slate-900/60 px-3 py-2">
                      {option}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
