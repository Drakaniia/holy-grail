#!/usr/bin/env node

/**
 * Post-install script for the grail-cli npm package.
 *
 * Runs after `npm install grail-cli` or `npx grail-cli`.
 *
 * Strategy (in order):
 * 1. Check if binary already exists → skip
 * 2. Download prebuilt binary from GitHub release
 * 3. Fall back to `cargo build` if Rust is available
 */

import { existsSync, mkdirSync, createWriteStream, readFileSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { get } from "node:https";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const pkgDir = scriptDir.endsWith("dist") ? dirname(scriptDir) : scriptDir;

const binaryName = process.platform === "win32" ? "grail.exe" : "grail";
const platform = `${process.platform}-${process.arch}`;
const binDir = resolve(pkgDir, "bin", `grail-${platform}`);
const binaryPath = resolve(binDir, binaryName);

/** Read package version synchronously from package.json */
function getPackageVersion(): string {
  try {
    const pkgPath = resolve(pkgDir, "package.json");
    const content = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(content);
    return pkg.version || "0.1.0";
  } catch {
    return "0.1.0";
  }
}

/** Download a file from a URL to a local path */
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolveFn, reject) => {
    const file = createWriteStream(dest);
    get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        file.close();
        downloadFile(response.headers.location!, dest).then(resolveFn, reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolveFn();
      });
    }).on("error", (err) => {
      file.close();
      reject(err);
    });
  });
}

async function tryDownloadBinary(): Promise<boolean> {
  const version = getPackageVersion();
  const ext = process.platform === "win32" ? ".exe" : "";
  const assetName = `grail-${platform}${ext}`;
  const url = `https://github.com/Drakaniia/holy-grail/releases/download/v${version}/${assetName}`;

  console.log(`  → Attempting to download prebuilt binary: ${assetName}`);

  try {
    mkdirSync(binDir, { recursive: true });
    await downloadFile(url, binaryPath);

    // Make executable on Unix
    if (process.platform !== "win32") {
      spawnSync("chmod", ["+x", binaryPath]);
    }

    if (existsSync(binaryPath)) {
      console.log(`  ✓ Downloaded to ${binaryPath}`);
      return true;
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.log(`  ✗ Download failed: ${msg}`);
  }

  return false;
}

async function tryBuildFromSource(): Promise<boolean> {
  const cargo = spawnSync("cargo", ["--version"], { stdio: "pipe" });
  if (cargo.status !== 0) {
    console.log("  ✗ Rust/Cargo not found. Skipping source build.");
    return false;
  }

  console.log("  → Building grail CLI from source (this may take a minute)...");
  const build = spawnSync("cargo", ["build", "--release"], {
    cwd: pkgDir,
    stdio: "inherit",
  });

  if (build.status !== 0) {
    console.error("  ✗ Failed to build from source.");
    return false;
  }

  // Copy binary to production path
  const builtBinary = resolve(pkgDir, "target", "release", binaryName);
  if (existsSync(builtBinary)) {
    mkdirSync(binDir, { recursive: true });
    try {
      copyFileSync(builtBinary, binaryPath);
      console.log(`  ✓ Built and placed at ${binaryPath}`);
      return true;
    } catch (e) {
      console.error(`  ✗ Failed to copy binary: ${e}`);
      return false;
    }
  }

  console.log(`  ✗ Binary not found at ${builtBinary} after build`);
  return false;
}

// ── Main ──

if (existsSync(binaryPath)) {
  console.log(`  ✓ Binary already exists at ${binaryPath}`);
  process.exit(0);
}

console.log("\n📦 Setting up grail-cli...\n");

const downloaded = await tryDownloadBinary();
if (downloaded) {
  console.log("  ✓ grail-cli ready!\n");
  process.exit(0);
}

const built = await tryBuildFromSource();
if (built) {
  console.log("  ✓ grail-cli ready!\n");
  process.exit(0);
}

console.error(
  "\n⚠ No prebuilt binary available for your platform and Rust/Cargo is not installed.\n" +
  "  Install Rust from https://rustup.rs/ and run this again, or open an issue:\n" +
  "  https://github.com/Drakaniia/holy-grail/issues/new\n"
);
process.exit(1);
