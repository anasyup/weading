#!/usr/bin/env node
/* Daily backup: snapshots the SQLite database into backups/ with a timestamp,
   keeps the last 14 (retention). Production swaps this for pg_dump + off-site
   object storage — see MASTER_SPEC.md §8 (backup/recovery). */
import fs from "node:fs";
import path from "node:path";

const src = path.resolve("prisma/dev.db");
const dir = path.resolve("backups");
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dest = path.join(dir, `dev-${stamp}.db`);
fs.copyFileSync(src, dest);

const keep = fs.readdirSync(dir).filter((f) => f.startsWith("dev-")).sort();
while (keep.length > 14) {
  const oldest = keep.shift();
  if (oldest) fs.rmSync(path.join(dir, oldest));
}
console.log(`Backup written: ${dest} (retention: last 14)`);
