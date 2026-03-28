import { stderr, stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

import type { JsonFileInfo } from "./types/types.ts";

export function usage() {
  stdout.write(`Usage: bun run start.ts [--unsafe]

Options:
  --unsafe  Include all JSON files from ./result without prompting.
`);
}

export function parseArgs(args: string[]) {
  let safeMode = true;
  let help = false;

  for (const arg of args) {
    if (arg === "--unsafe") {
      safeMode = false;
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }

    stderr.write(`Unknown option: ${arg}\n`);
    usage();
    process.exit(1);
  }

  return { safeMode, help };
}

function formatSize(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = unitIndex === 0 ? `${value}` : value.toFixed(value >= 10 ? 0 : 1);
  return `${formatted}${units[unitIndex]}`;
}

export async function promptForSelection(files: JsonFileInfo[]) {
  stdout.write("Select files to include in the zip.\n");
  stdout.write("Enter numbers separated by spaces.\n");

  files.forEach((file, index) => {
    stdout.write(`${index + 1}. ${file.name} (${formatSize(file.size)})\n`);
  });

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const selection = (await rl.question("Selection: ")).trim();

    if (!selection) {
      stderr.write("No files selected.\n");
      process.exit(1);
    }

    const indexes = selection.split(/\s+/);
    const seen = new Set<number>();
    const selectedFiles: JsonFileInfo[] = [];

    for (const indexText of indexes) {
      if (!/^\d+$/.test(indexText)) {
        stderr.write(`Invalid selection: ${indexText}\n`);
        process.exit(1);
      }

      const index = Number(indexText);
      if (index < 1 || index > files.length) {
        stderr.write(`Selection out of range: ${indexText}\n`);
        process.exit(1);
      }

      if (seen.has(index)) {
        continue;
      }

      seen.add(index);
      selectedFiles.push(files[index - 1]!);
    }

    return selectedFiles;
  } finally {
    rl.close();
  }
}
