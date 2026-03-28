import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import type { JsonFileInfo } from "./types/types.ts";
import type { WSchema } from "./types/WSchema.ts";

export async function getTopLevelJsonFiles(resultDir: string): Promise<JsonFileInfo[]> {
  const entries = await readdir(resultDir, { withFileTypes: true });

  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const path = join(resultDir, entry.name);
        const fileStat = await stat(path);

        return {
          name: entry.name,
          path,
          size: fileStat.size,
        };
      }),
  );
}

export async function filterOutGroupChats(files: JsonFileInfo[]): Promise<JsonFileInfo[]> {
  const filtered = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(file.path, "utf8");
      const parsed = JSON.parse(raw) as WSchema;
      const hasGroupChat = Object.keys(parsed).some((chatId) => chatId.endsWith("@g.us"));

      return hasGroupChat ? null : file;
    }),
  );

  return filtered.filter((file): file is JsonFileInfo => file !== null);
}
