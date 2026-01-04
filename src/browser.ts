import { Cron, setWasmExports, isInitialized, WasmExports } from "./cron.js";

const PKG_NAME = "cron-js-wasm";
const PKG_VERSION = "0.0.2";
const CDN_URL = `https://cdn.jsdelivr.net/npm/${PKG_NAME}@${PKG_VERSION}/wasm/module.wasm`;

let loadingPromise: Promise<void> | null = null;

// Minimal WASI implementation for browser
function createWasiImports(memory: WebAssembly.Memory) {
  return {
    wasi_snapshot_preview1: {
      fd_write: (
        fd: number,
        iovs_ptr: number,
        iovs_len: number,
        nwritten_ptr: number
      ): number => {
        const view = new DataView(memory.buffer);
        let written = 0;
        for (let i = 0; i < iovs_len; i++) {
          const ptr = view.getUint32(iovs_ptr + i * 8, true);
          const len = view.getUint32(iovs_ptr + i * 8 + 4, true);
          const bytes = new Uint8Array(memory.buffer, ptr, len);
          if (fd === 1) {
            console.log(new TextDecoder().decode(bytes));
          } else if (fd === 2) {
            console.error(new TextDecoder().decode(bytes));
          }
          written += len;
        }
        view.setUint32(nwritten_ptr, written, true);
        return 0;
      },
      fd_close: (): number => 0,
      fd_fdstat_get: (): number => 0,
      fd_seek: (): number => 0,
      fd_read: (): number => 0,
      fd_prestat_get: (): number => 8, // EBADF
      fd_prestat_dir_name: (): number => 8, // EBADF
      path_open: (): number => 44, // ENOENT - file not found (no filesystem in browser)
      environ_sizes_get: (
        count_ptr: number,
        size_ptr: number
      ): number => {
        const view = new DataView(memory.buffer);
        view.setUint32(count_ptr, 0, true);
        view.setUint32(size_ptr, 0, true);
        return 0;
      },
      environ_get: (): number => 0,
      args_sizes_get: (
        argc_ptr: number,
        argv_buf_size_ptr: number
      ): number => {
        const view = new DataView(memory.buffer);
        view.setUint32(argc_ptr, 0, true);
        view.setUint32(argv_buf_size_ptr, 0, true);
        return 0;
      },
      args_get: (): number => 0,
      clock_time_get: (
        clock_id: number,
        precision: bigint,
        time_ptr: number
      ): number => {
        const view = new DataView(memory.buffer);
        const now = BigInt(Date.now()) * BigInt(1_000_000);
        view.setBigUint64(time_ptr, now, true);
        return 0;
      },
      proc_exit: (code: number): void => {
        throw new Error(`WASI proc_exit called with code ${code}`);
      },
      random_get: (buf: number, buf_len: number): number => {
        const bytes = new Uint8Array(memory.buffer, buf, buf_len);
        crypto.getRandomValues(bytes);
        return 0;
      },
    },
  };
}

async function init(wasmUrl: string = CDN_URL): Promise<void> {
  if (isInitialized()) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const response = await fetch(wasmUrl);
    const wasmBytes = await response.arrayBuffer();

    const wasmModule = await WebAssembly.compile(wasmBytes);

    // Create memory for WASI imports
    const memory = new WebAssembly.Memory({ initial: 256 });
    const wasiImports = createWasiImports(memory);

    const instance = await WebAssembly.instantiate(wasmModule, {
      ...wasiImports,
    });

    // Call _initialize if it exists (WASI reactor pattern)
    const exports = instance.exports as Record<string, unknown>;
    if (typeof exports._initialize === "function") {
      (exports._initialize as () => void)();
    }

    setWasmExports(exports as unknown as WasmExports);
  })();

  return loadingPromise;
}

export { init, Cron };
