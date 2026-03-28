#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { basename, resolve } from "node:path";
import { argv, exit, stderr, stdout } from "node:process";

import { parseArgs, promptForSelection, usage } from "./src/cli.ts";
import { buildImage, runContainer } from "./src/docker.ts";
import { filterOutGroupChats, getTopLevelJsonFiles } from "./src/files.ts";
import { buildZip } from "./src/zip.ts";

const IMAGE_NAME = "wce";
const RESULT_DIR = resolve(process.cwd(), "result");
const ZIP_NAME = resolve(process.cwd(), "whatsapp.zip");

async function main() {
  const args = parseArgs(argv.slice(2));

  if (args.help) {
    usage();
    return;
  }

  await buildImage(IMAGE_NAME);
  await runContainer(IMAGE_NAME, process.cwd());

  stdout.write("Step 3: Packaging JSON output...\n");

  const files = await getTopLevelJsonFiles(RESULT_DIR).catch(() => {
    stderr.write(`Result directory not found: ${RESULT_DIR}\n`);
    exit(1);
  });

  if (!files || files.length === 0) {
    stderr.write(`No JSON files found in ${RESULT_DIR}\n`);
    exit(1);
  }

  const directMessageFiles = await filterOutGroupChats(files);

  if (directMessageFiles.length === 0) {
    stderr.write(`No non-group JSON files found in ${RESULT_DIR}\n`);
    exit(1);
  }

  const selectedFiles = args.safeMode ? await promptForSelection(directMessageFiles) : directMessageFiles;

  if (selectedFiles.length === 0) {
    stderr.write("No files selected.\n");
    exit(1);
  }

  const zipBuffer = await buildZip(selectedFiles);
  await Bun.write(ZIP_NAME, zipBuffer);

  const digest = createHash("sha256").update(zipBuffer).digest("hex");
  stdout.write(`Created ${ZIP_NAME}\n`);
  stdout.write(`SHA256 ${basename(ZIP_NAME)}: ${digest}\n`);
}

await main();
