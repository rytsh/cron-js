export interface WasmExports {
  memory: WebAssembly.Memory;
  createCron: () => number;
  addSpec: (cronPtr: number, ptr: number, len: number) => number;
  cronNext: (cronPtr: number, unixSec: bigint) => bigint;
  cronPrev: (cronPtr: number, unixSec: bigint) => bigint;
  cronNextN: (cronPtr: number, unixSec: bigint, n: number, index: number) => bigint;
  cronPrevN: (cronPtr: number, unixSec: bigint, n: number, index: number) => bigint;
}

let wasmExports: WasmExports | null = null;

export function setWasmExports(exports: WasmExports): void {
  wasmExports = exports;
}

export function getWasmExports(): WasmExports {
  if (!wasmExports) {
    throw new Error("WASM not initialized. Call init() first.");
  }
  return wasmExports;
}

export function isInitialized(): boolean {
  return wasmExports !== null;
}

function writeString(str: string): { ptr: number; len: number } {
  const exports = getWasmExports();
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  const memView = new Uint8Array(exports.memory.buffer);
  const offset = exports.memory.buffer.byteLength - 4096;
  memView.set(encoded, offset);
  return { ptr: offset, len: encoded.length };
}

export class Cron {
  private ptr: number;

  constructor(specs: string | string[]) {
    const exports = getWasmExports();
    this.ptr = exports.createCron();

    const specList = Array.isArray(specs) ? specs : [specs];
    for (const spec of specList) {
      const { ptr, len } = writeString(spec);
      const result = exports.addSpec(this.ptr, ptr, len);
      if (result === 0) {
        throw new Error(`Invalid cron spec: ${spec}`);
      }
    }
  }

  add(spec: string): this {
    const exports = getWasmExports();
    const { ptr, len } = writeString(spec);
    const result = exports.addSpec(this.ptr, ptr, len);
    if (result === 0) {
      throw new Error(`Invalid cron spec: ${spec}`);
    }
    return this;
  }

  next(time: Date = new Date()): Date {
    const unix = Math.floor(time.getTime() / 1000);
    const nextUnix = getWasmExports().cronNext(this.ptr, BigInt(unix));
    return new Date(Number(nextUnix) * 1000);
  }

  prev(time: Date = new Date()): Date {
    const unix = Math.floor(time.getTime() / 1000);
    const prevUnix = getWasmExports().cronPrev(this.ptr, BigInt(unix));
    return new Date(Number(prevUnix) * 1000);
  }

  nextN(n: number, time: Date = new Date()): Date[] {
    const unix = Math.floor(time.getTime() / 1000);
    const exports = getWasmExports();
    return Array.from({ length: n }, (_, i) =>
      new Date(Number(exports.cronNextN(this.ptr, BigInt(unix), n, i)) * 1000)
    );
  }

  prevN(n: number, time: Date = new Date()): Date[] {
    const unix = Math.floor(time.getTime() / 1000);
    const exports = getWasmExports();
    return Array.from({ length: n }, (_, i) =>
      new Date(Number(exports.cronPrevN(this.ptr, BigInt(unix), n, i)) * 1000)
    );
  }
}
