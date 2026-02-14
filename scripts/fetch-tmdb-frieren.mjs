import "dotenv/config";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const key = process.env.TMDB_API_KEY;
if (!key) {
  console.error("TMDB_API_KEY not set in .env");
  process.exit(1);
}

const url = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=프리렌&language=ko-KR&page=1&include_adult=false`;
const res = await fetch(url);
const data = await res.json();

const outPath = join(__dirname, "..", "docs", "tmdb_response_프리렌.json");
writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
console.log("Saved:", outPath);
