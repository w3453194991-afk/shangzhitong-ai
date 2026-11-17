import { promises as fs } from "fs";
import path from "path";
import { createSeed } from "./seed";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_VERSION = 2;

declare global {
  // eslint-disable-next-line no-var
  var __sqDbCache: Database | undefined;
  // eslint-disable-next-line no-var
  var __sqDbQueue: Promise<unknown> | undefined;
}

async function loadDb(): Promise<Database> {
  if (globalThis.__sqDbCache) return globalThis.__sqDbCache;
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Database;
    if (parsed.version === SEED_VERSION) {
      globalThis.__sqDbCache = parsed;
      return parsed;
    }
  } catch {
    // fall through to reseed
  }
  const seeded = createSeed();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
  globalThis.__sqDbCache = seeded;
  return seeded;
}

async function persist(db: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

export async function getDb(): Promise<Database> {
  return loadDb();
}

/** Serialized read-modify-write. Mutate the db in place and return a value. */
export async function mutateDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const db = await loadDb();
    const result = await fn(db);
    await persist(db);
    return result;
  };
  const previous = globalThis.__sqDbQueue ?? Promise.resolve();
  const next = previous.then(run, run);
  globalThis.__sqDbQueue = next.catch(() => undefined);
  return next;
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function resetDbCache() {
  globalThis.__sqDbCache = undefined;
}
