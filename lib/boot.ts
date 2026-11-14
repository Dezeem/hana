import { getDb } from "./db/client";
import { ensureSeedCovers, seedIfEmpty } from "./db/seed";

type BootGlobal = typeof globalThis & { __hanaBooted?: boolean };

/**
 * Runs once per server process: open the database, make sure the schema is in
 * place, and seed the demo archive on a fresh install.
 */
export function ensureBoot(): void {
  const g = globalThis as BootGlobal;
  if (g.__hanaBooted) return;
  g.__hanaBooted = true;

  const started = Date.now();
  getDb();

  if (process.env.HANA_SEED !== "0") {
    ensureSeedCovers();
    seedIfEmpty();
  }

  if (!process.env.AUTH_SECRET) {
    console.warn(
      "[hana] AUTH_SECRET is not set — sessions use an insecure development secret.",
    );
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "[hana] ADMIN_PASSWORD is not set — the admin area is disabled (password: 'hana').",
    );
  }

  console.log(`[hana] database ready in ${Date.now() - started}ms`);
}
