/// <reference types="vitest/globals" />

import { Buffer as B } from '../src/index.ts'

describe('deprecated methods', function () {
  it('.get (deprecated)', function () {
    const b = new B([7, 42])
    expect(b.get(0)).toBe(7)
    expect(b.get(1)).toBe(42)
  })

  it('.set (deprecated)', function () {
    const b = new B(2)
    b.set(7, 0)
    b.set(42, 1)
    expect(b[0]).toBe(7)
    expect(b[1]).toBe(42)
  })
})
