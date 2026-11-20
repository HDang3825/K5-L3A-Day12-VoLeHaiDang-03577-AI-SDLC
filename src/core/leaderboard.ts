// src/core/leaderboard.ts
// Local Top-10 leaderboard persisted to data/leaderboard.json

import * as fs from "fs";
import * as path from "path";

export interface LeaderboardEntry {
  name: string;
  score: number;
  nights_won: number;
  achieved_at: string; // ISO 8601
  seed: number;
}

export interface AddScoreResult {
  added: boolean;       // true if the entry made it into the top 10
  rank: number | null;  // 1-based rank, or null if it did not qualify
  entries: LeaderboardEntry[];
}

export class LeaderboardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeaderboardValidationError";
  }
}

export const MAX_ENTRIES = 10;
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 12;
export const LEADERBOARD_PATH = path.resolve(process.cwd(), "data", "leaderboard.json");

const NAME_REGEX = /^[A-Za-z0-9_]{3,12}$/;
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidIso8601(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_8601_REGEX.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

function validationError(entry: unknown): string | null {
  if (entry === null || typeof entry !== "object") return "Entry must be an object.";
  const e = entry as Record<string, unknown>;

  if (typeof e.name !== "string" || !NAME_REGEX.test(e.name)) {
    return `name must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters of [A-Za-z0-9_].`;
  }
  if (typeof e.score !== "number" || !Number.isSafeInteger(e.score) || e.score < 0) {
    return "score must be a non-negative integer.";
  }
  if (
    typeof e.nights_won !== "number" ||
    !Number.isSafeInteger(e.nights_won) ||
    e.nights_won < 0
  ) {
    return "nights_won must be a non-negative integer.";
  }
  if (!isValidIso8601(e.achieved_at)) {
    return "achieved_at must be a valid ISO 8601 date-time string (e.g. 2025-01-31T22:15:00Z).";
  }
  if (typeof e.seed !== "number" || !Number.isSafeInteger(e.seed)) {
    return "seed must be an integer.";
  }
  return null;
}

function sanitize(entry: LeaderboardEntry): LeaderboardEntry {
  return {
    name: entry.name,
    score: entry.score,
    nights_won: entry.nights_won,
    achieved_at: entry.achieved_at,
    seed: entry.seed,
  };
}

// ---------------------------------------------------------------------------
// Sorting: score desc, then earlier achieved_at first. Stable otherwise.
// ---------------------------------------------------------------------------

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries
    .map((entry, index) => ({ entry, index, time: Date.parse(entry.achieved_at) }))
    .sort((a, b) => {
      if (b.entry.score !== a.entry.score) return b.entry.score - a.entry.score;
      if (a.time !== b.time) return a.time - b.time;
      return a.index - b.index;
    })
    .map((x) => x.entry);
}

// ---------------------------------------------------------------------------
// Disk I/O
// ---------------------------------------------------------------------------

function atomicWriteJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      /* ignore cleanup failure */
    }
    throw err;
  }
}

function loadEntries(): LeaderboardEntry[] {
  let raw: string;
  try {
    raw = fs.readFileSync(LEADERBOARD_PATH, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt file: preserve it for inspection and start fresh.
    try {
      fs.renameSync(LEADERBOARD_PATH, `${LEADERBOARD_PATH}.corrupt-${Date.now()}`);
    } catch {
      /* ignore */
    }
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const valid: LeaderboardEntry[] = [];
  for (const item of parsed) {
    if (validationError(item) === null) valid.push(sanitize(item as LeaderboardEntry));
  }
  return sortEntries(valid).slice(0, MAX_ENTRIES);
}

function saveEntries(entries: LeaderboardEntry[]): void {
  atomicWriteJson(LEADERBOARD_PATH, entries);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates and adds a score. Keeps only the top 10 and persists to disk.
 * Throws LeaderboardValidationError if the entry is invalid.
 */
export function addScore(entry: LeaderboardEntry): AddScoreResult {
  const problem = validationError(entry);
  if (problem !== null) throw new LeaderboardValidationError(problem);

  const newEntry = sanitize(entry);
  const current = loadEntries();
  const combined = sortEntries([...current, newEntry]);
  const top = combined.slice(0, MAX_ENTRIES);

  const idx = top.indexOf(newEntry);
  const added = idx !== -1;

  if (added) saveEntries(top);

  return {
    added,
    rank: added ? idx + 1 : null,
    entries: top.map(sanitize),
  };
}

/**
 * Returns the current top scores (max 10), sorted by score desc,
 * ties broken by earlier achieved_at.
 */
export function getTopScores(): LeaderboardEntry[] {
  return loadEntries().map(sanitize);
}

/**
 * Exports the current leaderboard as JSON to the given path.
 * Returns the resolved output path.
 */
export function exportLeaderboard(outPath: string): string {
  if (typeof outPath !== "string" || outPath.trim().length === 0) {
    throw new Error("exportLeaderboard: outPath must be a non-empty string.");
  }
  const resolved = path.resolve(outPath);
  atomicWriteJson(resolved, getTopScores());
  return resolved;
}