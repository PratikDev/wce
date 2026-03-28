import { exit, stdout } from "node:process";

async function runCommand(command: string[], stepLabel: string) {
  stdout.write(`${stepLabel}\n`);

  const proc = Bun.spawn(command, {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    exit(exitCode);
  }
}

export function buildImage(imageName: string) {
  return runCommand(["docker", "build", "-t", imageName, "."], "Step 1: Building the Docker image...");
}

export function runContainer(imageName: string, cwd: string) {
  return runCommand(
    ["docker", "run", "--rm", "--mount", `type=bind,source=${cwd},target=/work`, `${imageName}:latest`],
    "Step 2: Running the container...",
  );
}
