import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

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

test.before(async () => {
  server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (!server) {
    return;
  }

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

test("serves config defaults", async () => {
  const response = await fetch(`${baseUrl}/api/config`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    kakaoJsKey: "",
    promotion: null,
    features: {
      tmdbSearch: false,
      aiQuestions: false,
      kakaoShare: false,
      kakaoLogin: false,
      sharedRecords: false,
    },
  });
});

test("validates kakao token request", async () => {
  const response = await fetch(`${baseUrl}/api/kakao/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "code is required");
});

test("rejects kakao user lookup without access token", async () => {
  const response = await fetch(`${baseUrl}/api/kakao/user`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error, "Access token is required");
});

test("reports missing TMDB key", async () => {
  const response = await fetch(`${baseUrl}/api/tmdb/search?q=test`);
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.error, "TMDB_API_KEY is not set in .env");
});

test("reports missing OpenAI key", async () => {
  const response = await fetch(`${baseUrl}/api/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "test", overview: "test overview" }),
  });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.error, "OPENAI_API_KEY is not set in .env");
});

test("validates shared-record payload before KV access", async () => {
  const response = await fetch(`${baseUrl}/api/shared-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "title, type, data are required");
});

test("reports unavailable shared-records storage on read", async () => {
  const response = await fetch(`${baseUrl}/api/shared-records`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, "Shared records storage is not configured");
  assert.equal(body.code, "SHARED_RECORDS_UNAVAILABLE");
});

test("reports unavailable shared-records storage on titles", async () => {
  const response = await fetch(`${baseUrl}/api/shared-records/titles`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, "Shared records storage is not configured");
  assert.equal(body.code, "SHARED_RECORDS_UNAVAILABLE");
});

test("reports unavailable shared-records storage on valid save", async () => {
  const response = await fetch(`${baseUrl}/api/shared-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Title",
      type: "book",
      data: { questions: [] },
      userId: "test-user",
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, "Shared records storage is not configured");
  assert.equal(body.code, "SHARED_RECORDS_UNAVAILABLE");
});
