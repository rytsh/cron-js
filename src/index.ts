import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { WASI } from "node:wasi";
import { Cron, setWasmExports, isInitialized, WasmExports } from "./cron.js";

let loadingPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  if (isInitialized()) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    const wasmPath = join(__dirname, "..", "wasm", "module.wasm");
    const wasmBytes = await readFile(wasmPath);

    const wasi = new WASI({
      version: "preview1",
    });

    const wasmModule = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });

    // Start WASI - use start() if _start exists, otherwise initialize()
    const exports = instance.exports as Record<string, unknown>;
    if (typeof exports._start === "function") {
      wasi.start(instance);
    } else {
      wasi.initialize(instance);
    }

    setWasmExports(instance.exports as unknown as WasmExports);
  })();

  return loadingPromise;
}

export { init, Cron };
