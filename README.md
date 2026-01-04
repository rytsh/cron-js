# cron-js-wasm

Cron parser WASM library for Node.js and browsers, powered by TinyGo.

## Installation

```bash
pnpm add cron-js-wasm
```

## Usage

```typescript
import { init, Cron } from "cron-js-wasm";

// Initialize WASM module first
await init();

// Create a cron instance with a single spec
const cron = new Cron("0 7 * * 1-5");

// Or with multiple specs as an array
const cron = new Cron(["0 7 * * 1-5", "0 9 * * 6"]);

// Add more specs later
cron.add("0 12 * * *");

// Get next occurrence
const next = cron.next();

// Get previous occurrence
const prev = cron.prev();

// Get next N occurrences
const nextThree = cron.nextN(3);

// Get previous N occurrences
const prevThree = cron.prevN(3);

// Get next occurrence from a specific time
const nextFromDate = cron.next(new Date("2025-01-01"));
```

## Browser Usage

The package automatically uses the browser entry point when bundled with Vite, Webpack, esbuild, etc.

```typescript
import { init, Cron } from "cron-js-wasm";

// Initialize - automatically loads WASM from jsDelivr CDN
await init();

const cron = new Cron("0 7 * * 1-5");
console.log(cron.next());
```

To use a custom WASM URL (e.g., self-hosted):

```typescript
await init("/wasm/module.wasm");
```

### Self-hosting the WASM file

Copy the WASM file from `node_modules` to your public directory during build:

**Vite**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/cron-js-wasm/wasm/module.wasm",
          dest: "wasm",
        },
      ],
    }),
  ],
});
```

**Manual / npm script**

```json
{
  "scripts": {
    "copy:wasm": "cp node_modules/cron-js-wasm/wasm/module.wasm public/wasm/"
  }
}
```

Then initialize with your hosted path:

```typescript
import { init, Cron } from "cron-js-wasm";

await init("/wasm/module.wasm");
```

## API

### `init(wasmUrl?: string): Promise<void>`

Initialize the WASM module. Must be called before creating `Cron` instances.

- Node.js: No arguments needed, loads from the package's wasm directory
- Browser: No arguments needed, loads from jsDelivr CDN. Pass a custom URL to self-host.

### `new Cron(specs: string | string[])`

Create a new Cron instance with one or more cron specifications.

### `cron.add(spec: string): Cron`

Add a cron specification to the instance. Returns `this` for chaining.

### `cron.next(time?: Date): Date`

Get the next occurrence after the given time (defaults to now).

### `cron.prev(time?: Date): Date`

Get the previous occurrence before the given time (defaults to now).

### `cron.nextN(n: number, time?: Date): Date[]`

Get the next N occurrences after the given time.

### `cron.prevN(n: number, time?: Date): Date[]`

Get the previous N occurrences before the given time.

## Building

Requires [TinyGo](https://tinygo.org/getting-started/install/) to build the WASM module.

```bash
# Build WASM module
pnpm build:wasm

# Build TypeScript
pnpm build
```
