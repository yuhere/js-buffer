/// <reference types="vitest/globals" />

import { Buffer as B } from '../src/index.ts'

describe('Buffer.isEncoding', function () {
  it('should return true for valid encodings', function () {
    expect(B.isEncoding('HEX')).toBe(true)
    expect(B.isEncoding('hex')).toBe(true)
  })

  it('should return false for invalid encodings', function () {
    expect(B.isEncoding('bad')).toBe(false)
  })
})
