import { once } from "node:events";
import { test, expect } from "@playwright/test";

for (const key of [
  "TMDB_API_KEY",
  "OPENAI_API_KEY",
  "KAKAO_JS_KEY",
  "KAKAO_REST_API_KEY",
  "KAKAO_CLIENT_SECRET",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
]) {
  delete process.env[key];
}

process.env.VERCEL = "1";

const { default: app } = await import("../server.js");

let server;
let baseUrl;

test.beforeAll(async () => {
  server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (!server) return;

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test("main page disables unavailable actions", async ({ page }) => {
  await page.goto(baseUrl);

  await expect(page.locator("#site-share-btn")).toBeDisabled();
  await expect(page.locator("#conjure-question-btn")).toBeDisabled();
  await expect(page.locator("#share-qa-btn")).toBeDisabled();
  await expect(page.locator("#share-book-btn")).toBeDisabled();
  await expect(page.locator("#promo-banner")).not.toBeVisible();

  const sharedLibraryLink = page.locator("#shared-library-link");
  await expect(sharedLibraryLink).toHaveAttribute("aria-disabled", "true");
});

test("share page explains when shared records are unavailable", async ({ page }) => {
  await page.goto(`${baseUrl}/share.html`);

  await expect(page.locator(".empty-state")).toContainText("공유 저장소가 아직 설정되지 않았습니다");
  await expect(page.locator("#tab-random")).toBeDisabled();
  await expect(page.locator("#tab-by-title")).toBeDisabled();
  await expect(page.locator("#tab-my-books")).toBeDisabled();
});

test("migrates legacy local storage records into the current library", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "arcane_archive",
      JSON.stringify({
        archiveData: {
          "Legacy Title": [
            {
              q: "기존 질문",
              a: "기존 답변",
            },
          ],
        },
        workMetadata: {
          "Legacy Title": {
            overview: "예전 방식으로 저장된 줄거리",
          },
        },
      }),
    );
  });

  await page.goto(baseUrl);

  const legacyBook = page.locator(".grimoire:not(.grimoire-add)").filter({
    hasText: "Legacy Title",
  });
  await expect(legacyBook).toBeVisible();

  await legacyBook.click();
  await expect(page.locator("#book-title")).toHaveText("Legacy Title");
  await expect(page.locator("#q-text")).toHaveText("기존 질문");
  await expect(page.locator("#a-input")).toHaveValue("기존 답변");
});
