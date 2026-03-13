export type QuestionRecord = {
  q: string;
  a: string;
  options?: string[];
};

export type WorkRecord = {
  workKey: string;
  title: string;
  questions: QuestionRecord[];
};

export type WorkMetadata = {
  workKey: string;
  title: string;
  overview: string;
  mediaType: string;
  workId: string;
  posterPath?: string;
  releaseDate?: string;
};

export type LibraryState = {
  archiveData: Record<string, WorkRecord>;
  workMetadata: Record<string, WorkMetadata>;
  storageVersion: number;
};

export const NEXT_LIBRARY_STORAGE_KEY = "magic_house_next_library";

export function createDefaultQuestion(title: string): QuestionRecord {
  return {
    q: `'${title}'에 대한 첫 번째 기록을 시작하십시오.`,
    a: "",
  };
}

export function buildWorkKey(params: {
  workId?: string | number;
  mediaType?: string;
  title?: string;
}) {
  if (params.workId && params.mediaType) {
    return `${params.mediaType}:${params.workId}`;
  }

  return `legacy:${slugifyTitle(params.title || "untitled")}`;
}

export function slugifyTitle(title: string) {
  return encodeURIComponent(title.trim().toLowerCase());
}

export function createDemoLibraryState(): LibraryState {
  const works = [
    {
      title: "스즈메의 문단속",
      workId: "502356",
      mediaType: "movie",
      overview:
        "재난의 문이 열리는 세계에서 스즈메가 의자를 든 청년과 함께 문을 닫아 나가는 이야기.",
      questions: [
        {
          q: "스즈메가 처음 문을 마주했을 때 느꼈던 감정은 무엇이었나요?",
          a: "두려움과 호기심이 동시에 있었고, 그 감정이 이후 행동을 밀어준다고 느꼈어요.",
        },
        {
          q: "닫히지 않은 문이 이 작품에서 상징하는 것은 무엇이라고 생각하나요?",
          a: "개인의 상처와 사회적 재난이 아직 끝나지 않았다는 감각을 보여준다고 봤습니다.",
        },
      ],
    },
    {
      title: "장송의 프리렌",
      workId: "209867",
      mediaType: "tv",
      overview:
        "마왕을 쓰러뜨린 뒤 오랜 시간을 사는 엘프 프리렌이 뒤늦게 인간과 기억의 의미를 배워가는 여정.",
      questions: [
        {
          q: "프리렌이 과거를 돌아보는 방식은 왜 뒤늦게 변했다고 느껴지나요?",
          a: "시간이 충분히 흐른 뒤에야 상실의 의미를 체감하게 되었기 때문이라고 생각해요.",
        },
        {
          q: "이 작품이 전투보다 기억과 관계를 더 중요하게 다루는 이유는 무엇일까요?",
          a: "여정의 목적이 승리가 아니라 남겨진 사람과 기억의 해석으로 옮겨가기 때문입니다.",
        },
      ],
    },
    {
      title: "인사이드 아웃 2",
      workId: "1022789",
      mediaType: "movie",
      overview:
        "성장기의 라일리 안에 새로운 감정들이 등장하면서 마음속 균형이 다시 흔들리는 이야기.",
      questions: [
        {
          q: "새로운 감정이 들어왔을 때 기존 감정들과의 갈등은 어떻게 보였나요?",
          a: "불안이 중심을 잡으려 하면서 기존 감정들의 역할이 밀려나는 게 현실적이었어요.",
        },
        {
          q: "이 작품이 말하는 '성장'은 감정을 없애는 일일까요, 함께 두는 일일까요?",
          a: "없애는 게 아니라 서로 공존하게 만드는 과정이라고 느꼈습니다.",
        },
      ],
    },
  ];

  const archiveData: Record<string, WorkRecord> = {};
  const workMetadata: Record<string, WorkMetadata> = {};

  works.forEach((work) => {
    const workKey = buildWorkKey(work);
    archiveData[workKey] = {
      workKey,
      title: work.title,
      questions: work.questions,
    };
    workMetadata[workKey] = {
      workKey,
      title: work.title,
      overview: work.overview,
      mediaType: work.mediaType,
      workId: work.workId,
    };
  });

  return {
    archiveData,
    workMetadata,
    storageVersion: 2,
  };
}
