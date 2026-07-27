/**
 * Post-install script for the grail npm package.
 *
 * Runs after `npm install grail` or `npx grail`.
 * For the MVP, checks if the Rust binary needs to be compiled.
 * In production, this would download a prebuilt binary.
 */

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

/** Root of the cli/ package (one level up from dist/ when compiled). */
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const binaryName = process.platform === "win32" ? "grail.exe" : "grail";

// Check if a prebuilt binary exists
const platform = `${process.platform}-${process.arch}`;
const binaryPath = resolve(rootDir, "bin", `grail-${platform}`, binaryName);

if (!existsSync(binaryPath)) {
  // For development, check if cargo is available
  const cargoPath = spawnSync("cargo", ["--version"], { stdio: "pipe" });
  if (cargoPath.status === 0) {
    console.log("Building grail CLI from source...");
    const build = spawnSync("cargo", ["build", "--release"], {
      cwd: rootDir,
      stdio: "inherit",
    });
    if (build.status !== 0) {
      console.error(
        "Warning: Failed to build grail CLI. Run `cargo build` manually in cli/.",
      );
    }
  } else {
    console.log(
      "grail CLI binary not found. Download the prebuilt binary or build from source.",
    );
  }
}
