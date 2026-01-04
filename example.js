import { init, Cron } from "./dist/index.js";

async function main() {
  // Initialize WASM first
  await init();

  // Create a cron instance with multiple specs separated by ;
  const cron = new Cron("0 7 * * 1,2,3,4,5;0 9 * * 6");

  console.log("Cron specs: 0 7 * * 1,2,3,4,5;0 9 * * 6");
  console.log("(7am on weekdays, 9am on Saturday)\n");

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
