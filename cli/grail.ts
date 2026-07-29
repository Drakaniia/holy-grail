#!/usr/bin/env node

/**
 * grail — Holy Grail skill manager
 *
 * Locates and executes the Rust binary that was either:
 * 1. Built locally via `cargo build` (development)
 * 2. Downloaded as a prebuilt binary (production via npm)
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Path to the script itself. Used to derive the cli/ directory.
 * - Source (`tsx cli/grail.ts`): `.../cli/grail.ts` → cliDir = `.../cli/`
 * - Compiled (`dist/grail.js`):  `.../cli/dist/grail.js` → cliDir = `.../cli/`
 */
const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
/** The cli/ package directory (one level up from dist/). */
const cliDir = scriptDir.endsWith("dist") ? dirname(scriptDir) : scriptDir;
/** Project root (parent of cli/). */
const rootDir = dirname(cliDir);

/**
 * Find the grail binary. Search paths in priority order:
 * 1. Development: `cli/target/debug/grail` or `cli/target/release/grail`
 * 2. Legacy: `<project>/target/debug/grail` or `<project>/target/release/grail`
 * 3. Production: `cli/bin/grail-{platform}`
 * 4. Same dir as cli/ (standalone binary)
 */
function findBinary(): string | null {
  const binaryName = process.platform === "win32" ? "grail.exe" : "grail";

  // Check for development build — first relative to cli/ (most common)
  const devPaths = [
    resolve(cliDir, "target", "debug", binaryName),
    resolve(cliDir, "target", "release", binaryName),
    // Legacy: also check project-root target/
    resolve(rootDir, "target", "debug", binaryName),
    resolve(rootDir, "target", "release", binaryName),
  ];

  for (const p of devPaths) {
    if (existsSync(p)) return p;
  }

  // Check for production binary
  const platform = `${process.platform}-${process.arch}`;
  const prodPath = resolve(cliDir, "bin", `grail-${platform}`, binaryName);
  if (existsSync(prodPath)) return prodPath;

  // Check same directory as cli/
  const localPath = resolve(cliDir, binaryName);
  if (existsSync(localPath)) return localPath;

  return null;
}

const binary = findBinary();

if (!binary) {
  console.error(
    "Error: grail binary not found. Run `cargo build` in the cli/ directory first.",
  );
  process.exit(1);
}

const result = spawnSync(binary, process.argv.slice(2), {
  stdio: "inherit",
  env: { ...process.env },
});

process.exit(result.status ?? 1);
