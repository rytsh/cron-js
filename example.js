import { init, Cron } from "./dist/index.js";

async function main() {
  // Initialize WASM first
  await init();

  // Create a cron instance
  const cron = new Cron("*/5 * * * *");

  console.log("Cron spec: */5 * * * *");
  console.log("(Every 5 minutes)\n");

  // Next
  const next = cron.next();
  console.log("Next:", next);

  // Prev
  const prev = cron.prev();
  console.log("Prev:", prev);

  // NextN (next 3)
  const nextN = cron.nextN(3);
  console.log("Next 3:", nextN);

  // PrevN (prev 3)
  const prevN = cron.prevN(3);
  console.log("Prev 3:", prevN);
}

main().catch(console.error);
