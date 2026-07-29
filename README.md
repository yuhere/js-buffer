# @yuhere/js-buffer

> **Forked from [feross/buffer](https://github.com/feross/buffer)** — rewritten in TypeScript with modern ESM tooling.

[![npm downloads](https://img.shields.io/npm/dt/@yuhere/js-buffer.svg)](https://www.npmjs.com/package/@yuhere/js-buffer)
[![npm](https://img.shields.io/badge/npm-v2.1.18-blue)](https://www.npmjs.com/package/@yuhere/js-buffer)
[![coverage](https://img.shields.io/badge/coverage-99%25-brightgreen)](https://www.npmjs.com/package/@yuhere/js-buffer)

The buffer module from [Node.js](http://nodejs.org/), for the browser — backed by `Uint8Array`.

---

## Fork notice

This is a **TypeScript port** of [feross/buffer](https://github.com/feross/buffer) by [Feross Aboukhadijeh](https://feross.org).

Key changes from the original:
- Rewritten in **TypeScript** with full type declarations
- Build tooling migrated to **Vite** (Rollup-powered ESM output)
- Test framework migrated from Mocha/Chai to **Vitest**
- Published as `@yuhere/js-buffer` (ESM only)

---

## Install

```bash
npm install @yuhere/js-buffer
```

## Usage

```js
import { Buffer } from '@yuhere/js-buffer'

const buf = new Buffer('hello', 'utf8')
console.log(buf.toString('hex'))   // 68656c6c6f
console.log(buf.toString('base64')) // aGVsbG8=
```

## API

The API is 100% identical to Node.js's `Buffer` API. Read the [official Node.js docs](https://nodejs.org/api/buffer.html) for the full list of supported methods.

## Features

- Backed by Typed Arrays (`Uint8Array` / `ArrayBuffer`) — fast and memory-efficient
- Preserves Node.js Buffer API exactly
- `.slice()` returns instances of the same type (Buffer)
- Square-bracket `buf[4]` notation works everywhere
- Does not modify any browser prototypes

## Important differences

### Always use `Buffer.isBuffer`, not `instanceof Buffer`

The Buffer constructor returns an augmented `Uint8Array` for performance, so `instanceof Buffer` won't work. Always use `Buffer.isBuffer(b)` to check.

### `buf.slice()` and shared memory

In Node.js, `slice()` creates a new Buffer that shares memory with the original. This works correctly in modern browsers with typed array support. Very old browsers (Firefox < 30) use an alternate `Object`-based implementation where slices don't share memory.

## How it works

`Buffer` extends `Uint8Array`, adding all Node.js Buffer methods as properties on each instance. This gives us square-bracket indexing and fast typed-array operations without touching `Uint8Array.prototype`.

## Development

```bash
npm install
npm test              # Run Node tests
npm run test:browser  # Run browser tests (Playwright)
npm run test:coverage # Combined Node + Browser coverage
npm run build         # Build ESM output to lib/
```

## License

MIT. Copyright (C) [Feross Aboukhadijeh](https://feross.org), and other contributors. Originally forked from an MIT-licensed module by Romain Beauxis.
