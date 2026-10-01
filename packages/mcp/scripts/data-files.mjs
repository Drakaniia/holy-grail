// Single source of truth for the catalog snapshot file set.
//
// Filenames come from INDEX_FILES in ../src/constants.ts (compiled to
// ../dist/constants.js by the `tsc` step that always runs before `snapshot`
// and `bundle`); only the source paths and snapshot keys live here.
//
// Each entry is [sourcePathRelativeToWebPackage, filenameInDataDir, snapshotKey].
// copy-data.mjs copies every source into mcp/data; standalone-entry.js asserts
// its static JSON imports cover every snapshotKey, so adding or renaming an
// index fails the bundle build instead of silently shipping a server that reads
// stale or missing data.
import { INDEX_FILES } from '../dist/constants.js'

const SOURCES = {
  sites: 'public/content/sites-index.json',
  extensions: 'public/content/extensions-index.json',
  mcp: 'public/content/mcp-index.json',
  previews: 'src/content/site-previews.json',
  skills: 'public/content/skills-registry.json',
}

export const SNAPSHOT = Object.entries(SOURCES).map(([key, sourcePath]) => [
  sourcePath,
  INDEX_FILES[key],
  key,
])
