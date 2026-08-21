#!/usr/bin/env python3
"""Audit static site preview images and preview manifests.

This script intentionally uses only the Python standard library. It validates
the generated WebP files and the JSON metadata that the Vue app imports, then
prints a review report for missing, broken, stale, fallback, duplicate, or
suspiciously small previews.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_FULL_SIZE = (960, 600)
DEFAULT_SMALL_SIZE = (480, 300)
DEFAULT_MAX_AGE_DAYS = 15
DEFAULT_MIN_FULL_BYTES = 6500
DEFAULT_MIN_SMALL_BYTES = 2500

REGENERATE_CODES = {
    "bad_preview_dimensions",
    "fallback_preview",
    "invalid_webp",
    "missing_manifest_entry",
    "missing_preview_file",
    "stale_preview",
    "suspicious_tiny_preview",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Review generated site preview images for broken or placeholder captures."
    )
    parser.add_argument("--sites-index", default="src/content/sites-index.json")
    parser.add_argument("--manifest", default="src/content/site-previews.json")
    parser.add_argument("--public-manifest", default="public/previews/manifest.json")
    parser.add_argument("--previews-dir", default="public/previews")
    parser.add_argument("--report", help="Write a full JSON report to this path.")
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--fail-on", choices=("none", "error", "warning"), default="none")
    parser.add_argument("--show", type=int, default=40, help="Number of text issues to show.")
    parser.add_argument("--slug", action="append", default=[], help="Limit review to one slug.")
    parser.add_argument(
        "--max-age-days",
        type=int,
        default=DEFAULT_MAX_AGE_DAYS,
        help="Warn when capturedAt is older than this many days. Use 0 to disable.",
    )
    parser.add_argument("--min-full-bytes", type=int, default=DEFAULT_MIN_FULL_BYTES)
    parser.add_argument("--min-small-bytes", type=int, default=DEFAULT_MIN_SMALL_BYTES)
    return parser.parse_args()


def read_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    with temp_path.open("w", encoding="utf-8", newline="\n") as file:
        json.dump(value, file, indent=2, ensure_ascii=False)
        file.write("\n")
    temp_path.replace(path)


def issue(
    issues: list[dict[str, Any]],
    severity: str,
    code: str,
    message: str,
    *,
    slug: str | None = None,
    path: Path | str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    item: dict[str, Any] = {
        "severity": severity,
        "code": code,
        "message": message,
    }
    if slug:
        item["slug"] = slug
    if path:
        item["path"] = str(path).replace("\\", "/")
    if details:
        item["details"] = details
    issues.append(item)


def normalize_slug_filters(values: list[str]) -> set[str]:
    slugs: set[str] = set()
    for value in values:
        for slug in value.split(","):
            cleaned = slug.strip()
            if cleaned:
                slugs.add(cleaned)
    return slugs


def parse_size(value: tuple[int, int] | None) -> dict[str, int] | None:
    if value is None:
        return None
    return {"width": value[0], "height": value[1]}


def read_u24_le(data: bytes, offset: int) -> int:
    return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16)


def parse_webp_dimensions(data: bytes) -> tuple[int, int]:
    if len(data) < 20:
        raise ValueError("file is too small to be a valid WebP image")
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ValueError("missing RIFF/WEBP header")

    riff_size = int.from_bytes(data[4:8], "little")
    if riff_size + 8 > len(data):
        raise ValueError("RIFF size is larger than the file")

    offset = 12
    while offset + 8 <= len(data):
        chunk_type = data[offset : offset + 4]
        chunk_size = int.from_bytes(data[offset + 4 : offset + 8], "little")
        chunk_start = offset + 8
        chunk_end = chunk_start + chunk_size
        if chunk_end > len(data):
            name = chunk_type.decode("ascii", "replace")
            raise ValueError(f"chunk {name} extends past end of file")

        chunk = data[chunk_start:chunk_end]
        if chunk_type == b"VP8X":
            if len(chunk) < 10:
                raise ValueError("VP8X chunk is too small")
            width = read_u24_le(chunk, 4) + 1
            height = read_u24_le(chunk, 7) + 1
            return width, height

        if chunk_type == b"VP8L":
            if len(chunk) < 5 or chunk[0] != 0x2F:
                raise ValueError("VP8L chunk has an invalid signature")
            bits = int.from_bytes(chunk[1:5], "little")
            width = (bits & 0x3FFF) + 1
            height = ((bits >> 14) & 0x3FFF) + 1
            return width, height

        if chunk_type == b"VP8 ":
            if len(chunk) < 10 or chunk[3:6] != b"\x9d\x01\x2a":
                raise ValueError("VP8 chunk has an invalid keyframe header")
            width = int.from_bytes(chunk[6:8], "little") & 0x3FFF
            height = int.from_bytes(chunk[8:10], "little") & 0x3FFF
            return width, height

        offset = chunk_end + (chunk_size % 2)

    raise ValueError("no VP8, VP8L, or VP8X image chunk found")


def parse_captured_at(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        return datetime.fromisoformat(normalized).astimezone(timezone.utc)
    except ValueError:
        return None


def resolve_preview_path(
    preview_value: Any,
    previews_dir: Path,
    issues: list[dict[str, Any]],
    *,
    slug: str,
    field: str,
) -> Path | None:
    if not isinstance(preview_value, str) or not preview_value:
        issue(
            issues,
            "error",
            "invalid_manifest_path",
            f"Manifest field {field} is empty or not a string.",
            slug=slug,
        )
        return None

    normalized = preview_value.replace("\\", "/")
    if not normalized.startswith("/previews/"):
        issue(
            issues,
            "error",
            "invalid_manifest_path",
            f"Manifest field {field} must start with /previews/.",
            slug=slug,
            details={"value": preview_value},
        )
        return None

    relative = normalized.removeprefix("/previews/")
    candidate = (previews_dir / relative).resolve()
    previews_root = previews_dir.resolve()
    try:
        candidate.relative_to(previews_root)
    except ValueError:
        issue(
            issues,
            "error",
            "invalid_manifest_path",
            f"Manifest field {field} escapes the previews directory.",
            slug=slug,
            details={"value": preview_value},
        )
        return None

    return candidate


def validate_preview_file(
    file_path: Path,
    *,
    slug: str,
    label: str,
    expected_size: tuple[int, int],
    min_bytes: int,
    issues: list[dict[str, Any]],
) -> tuple[str, int] | None:
    if not file_path.exists():
        issue(
            issues,
            "error",
            "missing_preview_file",
            f"Missing {label} preview file.",
            slug=slug,
            path=file_path,
        )
        return None

    size = file_path.stat().st_size
    if size <= 0:
        issue(
            issues,
            "error",
            "missing_preview_file",
            f"{label.capitalize()} preview file is empty.",
            slug=slug,
            path=file_path,
        )
        return None

    data = file_path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    try:
        actual_size = parse_webp_dimensions(data)
    except ValueError as error:
        issue(
            issues,
            "error",
            "invalid_webp",
            f"{label.capitalize()} preview is not a valid WebP image: {error}.",
            slug=slug,
            path=file_path,
        )
        return digest, size

    if actual_size != expected_size:
        issue(
            issues,
            "error",
            "bad_preview_dimensions",
            f"{label.capitalize()} preview dimensions do not match the generated contract.",
            slug=slug,
            path=file_path,
            details={"expected": parse_size(expected_size), "actual": parse_size(actual_size)},
        )

    if size < min_bytes:
        issue(
            issues,
            "warning",
            "suspicious_tiny_preview",
            f"{label.capitalize()} preview is very small and may be blank or blocked.",
            slug=slug,
            path=file_path,
            details={"bytes": size, "threshold": min_bytes},
        )

    return digest, size


def build_regenerate_slugs(issues: list[dict[str, Any]]) -> list[str]:
    slugs = {
        item["slug"]
        for item in issues
        if item.get("slug") and item.get("code") in REGENERATE_CODES
    }
    return sorted(slugs)


def review(args: argparse.Namespace) -> dict[str, Any]:
    root = Path.cwd()
    sites_index_path = (root / args.sites_index).resolve()
    manifest_path = (root / args.manifest).resolve()
    public_manifest_path = (root / args.public_manifest).resolve()
    previews_dir = (root / args.previews_dir).resolve()

    issues: list[dict[str, Any]] = []
    slug_filters = normalize_slug_filters(args.slug)

    sites = read_json(sites_index_path, [])
    manifest = read_json(manifest_path, {})
    public_manifest = read_json(public_manifest_path, {})

    if not isinstance(sites, list):
        raise ValueError(f"{sites_index_path} must contain a JSON array")
    if not isinstance(manifest, dict):
        raise ValueError(f"{manifest_path} must contain a JSON object")
    if not isinstance(public_manifest, dict):
        raise ValueError(f"{public_manifest_path} must contain a JSON object")

    site_by_slug: dict[str, dict[str, Any]] = {}
    for site in sites:
        if not isinstance(site, dict):
            continue
        slug = site.get("slug")
        if not isinstance(slug, str) or not slug:
            issue(issues, "error", "invalid_site_slug", "A site entry has no slug.")
            continue
        if slug_filters and slug not in slug_filters:
            continue
        if slug in site_by_slug:
            issue(issues, "error", "duplicate_site_slug", "Duplicate site slug in site index.", slug=slug)
        site_by_slug[slug] = site

    preview_hashes: dict[str, list[str]] = defaultdict(list)
    referenced_files: set[Path] = set()
    now = datetime.now(timezone.utc)

    manifest_slugs = set(manifest)
    public_manifest_slugs = set(public_manifest)
    selected_slugs = set(site_by_slug)

    for slug in sorted((manifest_slugs | public_manifest_slugs) - selected_slugs):
        if slug_filters and slug not in slug_filters:
            continue
        issue(
            issues,
            "warning",
            "orphan_manifest_entry",
            "Preview manifest contains a slug that is not in the site index.",
            slug=slug,
        )

    for slug in sorted((manifest_slugs | public_manifest_slugs) & selected_slugs):
        if manifest.get(slug) != public_manifest.get(slug):
            issue(
                issues,
                "warning",
                "manifest_mismatch",
                "Source and public preview manifests differ for this slug.",
                slug=slug,
            )

    for slug, site in sorted(site_by_slug.items()):
        entry = manifest.get(slug)
        if not isinstance(entry, dict):
            issue(
                issues,
                "error",
                "missing_manifest_entry",
                "No preview manifest entry exists for this site.",
                slug=slug,
                details={"website": site.get("website")},
            )
            continue

        expected_image = f"/previews/{slug}.webp"
        expected_small = f"/previews/{slug}-sm.webp"
        if entry.get("image") != expected_image:
            issue(
                issues,
                "warning",
                "unexpected_manifest_path",
                "Full preview path does not match the slug naming convention.",
                slug=slug,
                details={"expected": expected_image, "actual": entry.get("image")},
            )
        if entry.get("small") != expected_small:
            issue(
                issues,
                "warning",
                "unexpected_manifest_path",
                "Small preview path does not match the slug naming convention.",
                slug=slug,
                details={"expected": expected_small, "actual": entry.get("small")},
            )

        if entry.get("fallback") is True:
            issue(
                issues,
                "warning",
                "fallback_preview",
                "Preview is a generated fallback, not a live site screenshot.",
                slug=slug,
                details={"sourceUrl": entry.get("sourceUrl")},
            )

        captured_at = parse_captured_at(entry.get("capturedAt"))
        if captured_at is None:
            issue(
                issues,
                "warning",
                "invalid_captured_at",
                "capturedAt is missing or invalid.",
                slug=slug,
                details={"capturedAt": entry.get("capturedAt")},
            )
        elif args.max_age_days > 0:
            age_days = (now - captured_at).total_seconds() / 86400
            if age_days > args.max_age_days:
                issue(
                    issues,
                    "warning",
                    "stale_preview",
                    "Preview is older than the configured freshness window.",
                    slug=slug,
                    details={
                        "capturedAt": entry.get("capturedAt"),
                        "ageDays": round(age_days, 1),
                        "maxAgeDays": args.max_age_days,
                    },
                )

        full_path = resolve_preview_path(entry.get("image"), previews_dir, issues, slug=slug, field="image")
        small_path = resolve_preview_path(entry.get("small"), previews_dir, issues, slug=slug, field="small")

        if full_path:
            referenced_files.add(full_path)
            full_result = validate_preview_file(
                full_path,
                slug=slug,
                label="full",
                expected_size=DEFAULT_FULL_SIZE,
                min_bytes=args.min_full_bytes,
                issues=issues,
            )
            if full_result:
                digest, byte_count = full_result
                preview_hashes[digest].append(slug)
                expected_bytes = entry.get("bytes")
                if isinstance(expected_bytes, int) and expected_bytes != byte_count:
                    issue(
                        issues,
                        "warning",
                        "manifest_bytes_mismatch",
                        "Manifest byte count does not match the full preview file.",
                        slug=slug,
                        path=full_path,
                        details={"manifestBytes": expected_bytes, "actualBytes": byte_count},
                    )

        if small_path:
            referenced_files.add(small_path)
            validate_preview_file(
                small_path,
                slug=slug,
                label="small",
                expected_size=DEFAULT_SMALL_SIZE,
                min_bytes=args.min_small_bytes,
                issues=issues,
            )

    for digest, slugs in sorted(preview_hashes.items()):
        if len(slugs) > 1:
            issue(
                issues,
                "warning",
                "duplicate_preview_image",
                "Multiple slugs have byte-identical full preview images.",
                details={"sha256": digest, "slugs": sorted(slugs)},
            )

    if previews_dir.exists():
        for file_path in sorted(previews_dir.glob("*.webp")):
            resolved = file_path.resolve()
            if resolved not in referenced_files:
                issue(
                    issues,
                    "warning",
                    "orphan_preview_file",
                    "Preview file is not referenced by the selected manifest.",
                    path=file_path,
                )

    counts = Counter(item["severity"] for item in issues)
    regenerate_slugs = build_regenerate_slugs(issues)
    return {
        "summary": {
            "sites": len(site_by_slug),
            "manifestEntries": len(manifest),
            "publicManifestEntries": len(public_manifest),
            "previewFiles": len(list(previews_dir.glob("*.webp"))) if previews_dir.exists() else 0,
            "errors": counts.get("error", 0),
            "warnings": counts.get("warning", 0),
            "infos": counts.get("info", 0),
            "regenerateCandidates": len(regenerate_slugs),
        },
        "issues": sorted(
            issues,
            key=lambda item: (
                {"error": 0, "warning": 1, "info": 2}.get(item["severity"], 3),
                item.get("slug", ""),
                item["code"],
            ),
        ),
        "regenerateSlugs": regenerate_slugs,
    }


def text_report(report: dict[str, Any], show_count: int) -> str:
    summary = report["summary"]
    issues = report["issues"]
    regenerate_slugs = report["regenerateSlugs"]
    lines = [
        "Site preview review",
        f"- Sites reviewed: {summary['sites']}",
        f"- Manifest entries: {summary['manifestEntries']}",
        f"- Public manifest entries: {summary['publicManifestEntries']}",
        f"- Preview files: {summary['previewFiles']}",
        f"- Errors: {summary['errors']}",
        f"- Warnings: {summary['warnings']}",
        f"- Regenerate candidates: {summary['regenerateCandidates']}",
    ]

    if not issues:
        lines.append("")
        lines.append("No preview issues found.")
        return "\n".join(lines)

    lines.append("")
    lines.append(f"Showing first {min(show_count, len(issues))} of {len(issues)} issues:")
    for item in issues[:show_count]:
        slug = f"{item['slug']} " if item.get("slug") else ""
        path = f" ({item['path']})" if item.get("path") else ""
        lines.append(
            f"- [{item['severity']}] {slug}{item['code']}: {item['message']}{path}"
        )

    if len(issues) > show_count:
        lines.append(f"- ... {len(issues) - show_count} more issues hidden.")

    if regenerate_slugs:
        shown_slugs = regenerate_slugs[:20]
        suffix = ",..." if len(regenerate_slugs) > len(shown_slugs) else ""
        lines.append("")
        lines.append("Suggested regeneration command:")
        lines.append(
            "bun run scripts/previews/generate-site-previews.js --all --slug "
            + ",".join(shown_slugs)
            + suffix
        )

    return "\n".join(lines)


def exit_code(report: dict[str, Any], fail_on: str) -> int:
    summary = report["summary"]
    if fail_on == "error" and summary["errors"] > 0:
        return 1
    if fail_on == "warning" and (summary["errors"] > 0 or summary["warnings"] > 0):
        return 1
    return 0


def main() -> int:
    args = parse_args()
    report = review(args)

    if args.report:
        write_json(Path(args.report), report)

    if args.format == "json":
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(text_report(report, max(args.show, 0)))

    return exit_code(report, args.fail_on)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Preview review failed: {error}", file=sys.stderr)
        raise SystemExit(2)
