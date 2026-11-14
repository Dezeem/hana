/**
 * Runs once when the Node.js server boots: opens SQLite, applies the schema and
 * seeds the demo archive on a fresh install.
 *
 * The runtime guard must stay in this exact shape — Next compiles this file for
 * the edge runtime as well, and only a statically analysable `NEXT_RUNTIME`
 * check lets the bundler drop the Node-only import.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureBoot } = await import("./lib/boot");
    ensureBoot();
  }
}
