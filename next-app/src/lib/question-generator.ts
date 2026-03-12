import { loadPromptFile } from "@/lib/prompt-loader";

type ExistingQaItem = {
  q: string;
  a?: string;
};

function normalizeQuestions(raw: string) {
  const sanitized = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    let parsed: unknown;

    try {
      parsed = JSON.parse(sanitized);
    } catch {
      parsed = JSON.parse(sanitized.replace(/\r?\n/g, " "));
    }

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .slice(0, 5)
      .map((item) => {
        if (typeof item === "string") {
          return { q: item.trim(), options: undefined };
        }

        if (item && typeof item === "object" && "q" in item && typeof item.q === "string") {
          const options = Array.isArray((item as { options?: unknown[] }).options)
            ? (item as { options?: unknown[] }).options
                ?.filter((option): option is string => typeof option === "string")
                .map((option) => option.replace(/\s+/g, " ").trim())
                .filter(Boolean)
                .slice(0, 10)
            : undefined;

          return {
            q: item.q.trim(),
            options: options?.length ? options : undefined,
          };
        }

        return null;
      })
      .filter(Boolean);
  } catch {
    return sanitized
      .split("\n")
      .map((value) => value.trim())
      .filter((value) => value && !value.startsWith("```"))
      .slice(0, 5)
      .map((value) => ({
        q: value.replace(/^["']|["']$/g, ""),
        options: undefined,
      }));
  }
}

export async function generateQuestions(input: {
  title?: string;
  overview: string;
  existingQA?: ExistingQaItem[];
}) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return {
      status: 500,
      body: { error: "OPENAI_API_KEY is not set in .env" },
    };
  }

  const overviewText = input.overview.trim();
  if (!overviewText) {
    return {
      status: 400,
      body: { error: "body.overview is required" },
    };
  }

  const qaList = Array.isArray(input.existingQA)
    ? input.existingQA
        .filter((item) => item && typeof item.q === "string")
        .slice(-15)
        .map((item) => ({
          q: item.q.trim(),
          a: typeof item.a === "string" ? item.a.trim() : "",
        }))
    : [];

  try {
    const systemContent = (await loadPromptFile("system-prompt.txt")).trim();
    let userContent = input.title
      ? `작품 제목: ${input.title}\n\n줄거리:\n${overviewText}`
      : `줄거리:\n${overviewText}`;

    if (qaList.length > 0) {
      const qaBlock = qaList
        .map((item) => `Q. ${item.q}\nA. ${item.a || "(미작성)"}`)
        .join("\n\n");
      userContent += `\n\n[기존 Q&A - 아래와 중복되지 않도록 하세요. 답변이 있는 경우, 그 답변을 바탕으로 꼬리질문(후속 질문)을 생성해도 됩니다]\n${qaBlock}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        status: response.status,
        body: {
          error: data.error?.message || "OpenAI API error",
          details: data,
        },
      };
    }

    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    return {
      status: 200,
      body: {
        questions: normalizeQuestions(raw),
      },
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}
