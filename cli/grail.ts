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

/** Root of the cli/ package (one level up from dist/ when compiled). */
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Find the grail binary. Search paths in priority order:
 * 1. Development: `<root>/target/debug/grail` or `<root>/target/release/grail`
 * 2. Production: `<root>/bin/grail-{platform}`
 */
function findBinary(): string | null {
  const binaryName = process.platform === "win32" ? "grail.exe" : "grail";

  // Check for development build first
  const devPaths = [
    resolve(rootDir, "target", "debug", binaryName),
    resolve(rootDir, "target", "release", binaryName),
  ];

  for (const p of devPaths) {
    if (existsSync(p)) return p;
  }

  // Check for production binary
  const platform = `${process.platform}-${process.arch}`;
  const prodPath = resolve(rootDir, "bin", `grail-${platform}`, binaryName);
  if (existsSync(prodPath)) return prodPath;

  // Check same directory as root
  const localPath = resolve(rootDir, binaryName);
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
