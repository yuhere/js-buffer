/// <reference types="vitest/globals" />

import { Buffer as B } from '../src/index.ts'

describe('utf16 surrogate pairs', function () {
  it('should detect utf16 surrogate pairs', function () {
    const text = '😸' + '💭' + '👍'
    const buf = new B(text)
    expect(text).toBe(buf.toString())
  })

  it('should throw on orphaned utf16 surrogate lead code point', function () {
    const text = '😸' + '\uD83D' + '👍'
    expect(() => {
      new B(text)
    }).toThrow(URIError)
  })

  it('should throw on orphaned utf16 surrogate trail code point', function () {
    const text = '😸' + '\uDCAD' + '👍'
    expect(() => {
      new B(text)
    }).toThrow(URIError)
  })
})
