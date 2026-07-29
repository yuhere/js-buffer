/// <reference types="vitest/globals" />

import { Buffer as B } from '../src/index.ts'

describe('Buffer.isBuffer', function () {
  it('should return true for Buffer instances', function () {
    expect(B.isBuffer(new B('hey', 'utf8'))).toBe(true)
    expect(B.isBuffer(new B([1, 2, 3]))).toBe(true)
  })

  it('should return false for non-Buffer values', function () {
    expect(B.isBuffer('hey')).toBe(false)
  })
})
