#!/usr/bin/env node
/**
 * Deletes the SQLite database so the next boot re-creates the schema and
 * reseeds the demo archive. Pass `--covers` to remove downloaded covers too.
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const db = path.join(dir, "hana.db");
let removed = 0;

for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${db}${suffix}`;
  if (fs.existsSync(file)) {
    fs.rmSync(file, { force: true });
    removed += 1;
    console.log(`removed ${file}`);
  }
}

if (process.argv.includes("--covers")) {
  const uploads = path.join(dir, "uploads");
  if (fs.existsSync(uploads)) {
    fs.rmSync(uploads, { recursive: true, force: true });
    console.log(`removed ${uploads}`);
  }
}

if (!removed) {
  console.log("no database file found — nothing to do");
} else {
  console.log("\nnext start will seed the demo archive again");
}
