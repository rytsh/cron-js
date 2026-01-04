import { Cron, setWasmExports, isInitialized, WasmExports } from "./cron.js";

const PKG_NAME = "cron-js";
const PKG_VERSION = "0.0.1";
const CDN_URL = `https://cdn.jsdelivr.net/npm/${PKG_NAME}@${PKG_VERSION}/wasm/module.wasm`;

let loadingPromise: Promise<void> | null = null;

async function init(wasmUrl: string = CDN_URL): Promise<void> {
  if (isInitialized()) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const response = await fetch(wasmUrl);
    const wasmBytes = await response.arrayBuffer();

    const wasmModule = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, {
      env: {},
    });

    setWasmExports(instance.exports as unknown as WasmExports);
  })();

  return loadingPromise;
}

export { init, Cron };
