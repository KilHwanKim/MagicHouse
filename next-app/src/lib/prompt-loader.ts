import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadPromptFile(filename: string) {
  return readFile(path.join(process.cwd(), "prompts", filename), "utf8");
}
