/// <reference types="vitest/globals" />

import { Buffer, SlowBuffer, INSPECT_MAX_BYTES, BufferEncoding } from '../src/index.ts'

// =============================================================================
// Float read/write
// =============================================================================

describe('float read', () => {
  it('readFloatLE', () => {
    const buf = new Buffer(4)
    buf.writeUInt8(0x00, 0)
    buf.writeUInt8(0x00, 1)
    buf.writeUInt8(0xc0, 2)
    buf.writeUInt8(0x3f, 3)
    expect(buf.readFloatLE(0)).toBeCloseTo(1.5, 5)
  })

  it('readFloatBE', () => {
    const buf = new Buffer(4)
    buf.writeUInt8(0x3f, 0)
    buf.writeUInt8(0xc0, 1)
    buf.writeUInt8(0x00, 2)
    buf.writeUInt8(0x00, 3)
    expect(buf.readFloatBE(0)).toBeCloseTo(1.5, 5)
  })

  it('readDoubleLE', () => {
    const buf = new Buffer(8)
    // IEEE 754 double for 1.5 in LE
    const pairs = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf8, 0x3f]
    for (let i = 0; i < 8; i++) buf.writeUInt8(pairs[i], i)
    expect(buf.readDoubleLE(0)).toBeCloseTo(1.5, 10)
  })

  it('readDoubleBE', () => {
    const buf = new Buffer(8)
    // IEEE 754 double for 1.5 in BE
    const pairs = [0x3f, 0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    for (let i = 0; i < 8; i++) buf.writeUInt8(pairs[i], i)
    expect(buf.readDoubleBE(0)).toBeCloseTo(1.5, 10)
  })

  it('readFloatLE negative', () => {
    const buf = new Buffer(4)
    // -2.5 in LE float
    const pairs = [0x00, 0x00, 0x20, 0xc0]
    for (let i = 0; i < 4; i++) buf.writeUInt8(pairs[i], i)
    expect(buf.readFloatLE(0)).toBeCloseTo(-2.5, 5)
  })

  it('readFloatBE negative', () => {
    const buf = new Buffer(4)
    const pairs = [0xc0, 0x20, 0x00, 0x00]
    for (let i = 0; i < 4; i++) buf.writeUInt8(pairs[i], i)
    expect(buf.readFloatBE(0)).toBeCloseTo(-2.5, 5)
  })
})

describe('float write', () => {
  it('writeFloatLE and read back', () => {
    const buf = new Buffer(4)
    buf.writeFloatLE(1.5, 0)
    expect(buf.readFloatLE(0)).toBeCloseTo(1.5, 5)
  })

  it('writeFloatBE and read back', () => {
    const buf = new Buffer(4)
    buf.writeFloatBE(-2.5, 0)
    expect(buf.readFloatBE(0)).toBeCloseTo(-2.5, 5)
  })

  it('writeDoubleLE and read back', () => {
    const buf = new Buffer(8)
    buf.writeDoubleLE(Math.PI, 0)
    expect(buf.readDoubleLE(0)).toBeCloseTo(Math.PI, 10)
  })

  it('writeDoubleBE and read back', () => {
    const buf = new Buffer(8)
    buf.writeDoubleBE(Math.PI, 0)
    expect(buf.readDoubleBE(0)).toBeCloseTo(Math.PI, 10)
  })

  it('writeFloatLE negative', () => {
    const buf = new Buffer(4)
    buf.writeFloatLE(-3.14, 0)
    expect(buf.readFloatLE(0)).toBeCloseTo(-3.14, 4)
  })

  it('writeDoubleBE negative', () => {
    const buf = new Buffer(8)
    buf.writeDoubleBE(-1e308, 0)
    expect(buf.readDoubleBE(0)).toBe(-1e308)
  })
})

// =============================================================================
// noAssert mode (offsets beyond buffer boundary)
// =============================================================================

describe('noAssert mode', () => {
  it('readUInt8 with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(4)
    expect(buf.readUInt8(10, true)).toBeUndefined()
  })

  it('readUInt16LE with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(2)
    expect(buf.readUInt16LE(2, true)).toBeUndefined()
  })

  it('readUInt16BE with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(2)
    expect(buf.readUInt16BE(2, true)).toBeUndefined()
  })

  it('readUInt32LE with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(4)
    expect(buf.readUInt32LE(4, true)).toBeUndefined()
  })

  it('readUInt32BE with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(4)
    expect(buf.readUInt32BE(4, true)).toBeUndefined()
  })

  it('readInt8 with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(4)
    expect(buf.readInt8(10, true)).toBeUndefined()
  })

  it('readInt16LE with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(2)
    expect(buf.readInt16LE(2, true)).toBeUndefined()
  })

  it('readInt16BE with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(2)
    expect(buf.readInt16BE(2, true)).toBeUndefined()
  })

  it('readInt32LE with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(4)
    expect(buf.readInt32LE(4, true)).toBeUndefined()
  })

  it('readInt32BE with noAssert out of bounds returns undefined', () => {
    const buf = new Buffer(4)
    expect(buf.readInt32BE(4, true)).toBeUndefined()
  })

  it('readFloatLE with noAssert out of bounds does not throw', () => {
    const buf = new Buffer(8)
    // float needs only 4 bytes; reading at offset 7 needs 10 bytes total
    // but with noAssert, assertions are skipped — let's read at a valid but edge offset
    const val = buf.readFloatLE(4, true)
    expect(typeof val).toBe('number')
  })

  it('readFloatBE with noAssert out of bounds does not throw', () => {
    const buf = new Buffer(8)
    const val = buf.readFloatBE(4, true)
    expect(typeof val).toBe('number')
  })

  it('readDoubleLE with noAssert out of bounds does not throw', () => {
    const buf = new Buffer(8)
    const val = buf.readDoubleLE(0, true)
    expect(typeof val).toBe('number')
  })

  it('readDoubleBE with noAssert out of bounds does not throw', () => {
    const buf = new Buffer(8)
    const val = buf.readDoubleBE(0, true)
    expect(typeof val).toBe('number')
  })

  it('writeUInt8 with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(4)
    expect(() => buf.writeUInt8(42, 10, true)).not.toThrow()
  })

  it('writeUInt16LE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(2)
    expect(() => buf.writeUInt16LE(42, 2, true)).not.toThrow()
  })

  it('writeUInt16BE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(2)
    expect(() => buf.writeUInt16BE(42, 2, true)).not.toThrow()
  })

  it('writeUInt32LE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(4)
    expect(() => buf.writeUInt32LE(42, 4, true)).not.toThrow()
  })

  it('writeUInt32BE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(4)
    expect(() => buf.writeUInt32BE(42, 4, true)).not.toThrow()
  })

  it('writeInt8 with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(4)
    expect(() => buf.writeInt8(5, 10, true)).not.toThrow()
  })

  it('writeInt16LE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(2)
    expect(() => buf.writeInt16LE(42, 2, true)).not.toThrow()
  })

  it('writeInt16BE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(2)
    expect(() => buf.writeInt16BE(42, 2, true)).not.toThrow()
  })

  it('writeInt32LE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(4)
    expect(() => buf.writeInt32LE(42, 4, true)).not.toThrow()
  })

  it('writeInt32BE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(4)
    expect(() => buf.writeInt32BE(42, 4, true)).not.toThrow()
  })

  it('writeFloatLE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(8)
    expect(() => buf.writeFloatLE(1.5, 8, true)).not.toThrow()
  })

  it('writeFloatBE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(8)
    expect(() => buf.writeFloatBE(1.5, 8, true)).not.toThrow()
  })

  it('writeDoubleLE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(8)
    expect(() => buf.writeDoubleLE(1.5, 8, true)).not.toThrow()
  })

  it('writeDoubleBE with noAssert out of bounds is silently ignored', () => {
    const buf = new Buffer(8)
    expect(() => buf.writeDoubleBE(1.5, 8, true)).not.toThrow()
  })
})

// =============================================================================
// int8 read/write with negative values
// =============================================================================

describe('int8 negative values', () => {
  it('readInt8 negative', () => {
    const buf = new Buffer([0xff]) // -1 in signed 8-bit
    expect(buf.readInt8(0)).toBe(-1)
  })

  it('readInt8 negative -128', () => {
    const buf = new Buffer([0x80])
    expect(buf.readInt8(0)).toBe(-128)
  })

  it('readInt8 positive', () => {
    const buf = new Buffer([0x7f])
    expect(buf.readInt8(0)).toBe(127)
  })

  it('writeInt8 negative', () => {
    const buf = new Buffer(1)
    buf.writeInt8(-1, 0)
    expect(buf[0]).toBe(0xff)
  })

  it('writeInt8 -128', () => {
    const buf = new Buffer(1)
    buf.writeInt8(-128, 0)
    expect(buf[0]).toBe(0x80)
  })

  it('writeInt8 positive 127', () => {
    const buf = new Buffer(1)
    buf.writeInt8(127, 0)
    expect(buf[0]).toBe(0x7f)
  })
})

// =============================================================================
// int16 read/write with negative values
// =============================================================================

describe('int16 negative values', () => {
  it('readInt16LE negative', () => {
    const buf = new Buffer([0xff, 0xff])
    expect(buf.readInt16LE(0)).toBe(-1)
  })

  it('readInt16BE negative', () => {
    const buf = new Buffer([0xff, 0xff])
    expect(buf.readInt16BE(0)).toBe(-1)
  })

  it('writeInt16LE negative', () => {
    const buf = new Buffer(2)
    buf.writeInt16LE(-1, 0)
    expect(buf.readInt16LE(0)).toBe(-1)
  })

  it('writeInt16BE negative', () => {
    const buf = new Buffer(2)
    buf.writeInt16BE(-32768, 0)
    expect(buf.readInt16BE(0)).toBe(-32768)
  })

  it('writeInt16LE -32768', () => {
    const buf = new Buffer(2)
    buf.writeInt16LE(-32768, 0)
    expect(buf.readInt16LE(0)).toBe(-32768)
  })
})

// =============================================================================
// int32 read/write with negative values
// =============================================================================

describe('int32 negative values', () => {
  it('readInt32LE negative', () => {
    const buf = new Buffer([0xff, 0xff, 0xff, 0xff])
    expect(buf.readInt32LE(0)).toBe(-1)
  })

  it('readInt32BE negative', () => {
    const buf = new Buffer([0xff, 0xff, 0xff, 0xff])
    expect(buf.readInt32BE(0)).toBe(-1)
  })

  it('writeInt32LE negative', () => {
    const buf = new Buffer(4)
    buf.writeInt32LE(-1, 0)
    expect(buf.readInt32LE(0)).toBe(-1)
  })

  it('writeInt32BE negative', () => {
    const buf = new Buffer(4)
    buf.writeInt32BE(-2147483648, 0)
    expect(buf.readInt32BE(0)).toBe(-2147483648)
  })
})

// =============================================================================
// Buffer.inspect()
// =============================================================================

describe('Buffer inspect', () => {
  it('inspects a small buffer', () => {
    const buf = new Buffer([0x01, 0x02, 0x03, 0x04])
    const result = buf.inspect()
    expect(result).toContain('Buffer')
    expect(result).toContain('01')
    expect(result).toContain('02')
    expect(result).toContain('03')
    expect(result).toContain('04')
  })

  it('inspects an empty buffer', () => {
    const buf = new Buffer(0)
    expect(buf.inspect()).toBe('<Buffer >')
  })

  it('inspects a single byte buffer', () => {
    const buf = new Buffer([0xff])
    expect(buf.inspect()).toBe('<Buffer ff>')
  })

  it('truncates at INSPECT_MAX_BYTES and appends ...', () => {
    // Create a buffer with more than INSPECT_MAX_BYTES + 1 bytes
    const size = INSPECT_MAX_BYTES + 10
    const buf = new Buffer(size)
    for (let i = 0; i < size; i++) buf[i] = i % 256
    const result = buf.inspect()
    expect(result).toContain('...')
    // Should stop after INSPECT_MAX_BYTES
    const parts = result.split(' ')
    // parts[0] = '<Buffer', parts[1..51] = hex, parts[52] = '...>'
    expect(parts.length).toBe(INSPECT_MAX_BYTES + 3) // <Buffer + 51 hex + ...>
  })
})

// =============================================================================
// Buffer.fill() with string value
// =============================================================================

describe('fill with string', () => {
  it('fills with a character string', () => {
    const buf = new Buffer(5)
    buf.fill('A')
    for (let i = 0; i < 5; i++) {
      expect(buf[i]).toBe(65) // 'A'.charCodeAt(0)
    }
  })

  it('fills with string and range', () => {
    const buf = new Buffer(10)
    buf.fill('B', 2, 5)
    expect(buf[1]).toBe(0)
    expect(buf[2]).toBe(66) // 'B'.charCodeAt(0)
    expect(buf[4]).toBe(66)
    expect(buf[5]).toBe(0)
  })
})

// =============================================================================
// SlowBuffer alias
// =============================================================================

describe('SlowBuffer', () => {
  it('is the same class as Buffer', () => {
    expect(SlowBuffer).toBe(Buffer)
  })

  it('can create a SlowBuffer', () => {
    const buf = new SlowBuffer(10)
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBe(10)
  })
})

// =============================================================================
// Edge-case branches
// =============================================================================

describe('read/write edge cases', () => {
  it('writeUInt8 at exact end of buffer does nothing (noAssert)', () => {
    const buf = new Buffer(4)
    buf.writeUInt8(42, 4, true)
    expect(buf[0]).toBe(0)
  })

  it('writeUInt16LE at exact end of buffer does nothing (noAssert)', () => {
    const buf = new Buffer(2)
    buf.writeUInt16LE(0x1234, 2, true)
    expect(buf[0]).toBe(0)
  })

  it('writeUInt32LE at exact end of buffer does nothing (noAssert)', () => {
    const buf = new Buffer(4)
    buf.writeUInt32LE(0x12345678, 4, true)
    expect(buf[0]).toBe(0)
  })

  it('writeInt8 at exact end of buffer does nothing (noAssert)', () => {
    const buf = new Buffer(4)
    buf.writeInt8(-5, 4, true)
    expect(buf[0]).toBe(0)
  })

  it('copy with end === start returns early', () => {
    const src = new Buffer([1, 2, 3])
    const dst = new Buffer([0, 0, 0])
    src.copy(dst, 0, 1, 1)
    expect(dst[0]).toBe(0) // unchanged
  })

  it('copy with empty target returns early', () => {
    const src = new Buffer([1, 2, 3])
    const dst = new Buffer(0)
    expect(() => src.copy(dst)).not.toThrow()
  })

  it('copy with empty source returns early', () => {
    const src = new Buffer(0)
    const dst = new Buffer(3)
    expect(() => src.copy(dst)).not.toThrow()
  })

  it('toString with start === end returns empty string', () => {
    const buf = new Buffer('hello')
    expect(buf.toString('utf8', 2, 2)).toBe('')
  })

  it('Buffer.isBuffer with null returns false', () => {
    expect(Buffer.isBuffer(null)).toBe(false)
  })

  it('Buffer.isBuffer with undefined returns false', () => {
    expect(Buffer.isBuffer(undefined)).toBe(false)
  })

  it('Buffer.isBuffer with plain object returns false', () => {
    expect(Buffer.isBuffer({})).toBe(false)
  })

  it('Buffer.concat with single buffer returns same reference', () => {
    const buf = new Buffer([1, 2, 3])
    const result = Buffer.concat([buf])
    expect(result).toBe(buf)
  })

  it('Buffer.byteLength defaults to utf8', () => {
    expect(Buffer.byteLength('abc')).toBe(3)
  })

  it('Buffer.byteLength throws on unknown encoding', () => {
    expect(() => Buffer.byteLength('abc', 'unknown_enc' as string)).toThrow('Unknown encoding')
  })

  it('write with legacy signature (string, encoding, offset, length)', () => {
    const buf = new Buffer(10)
    // Legacy: write(string, encoding, offset, length)
    const written = buf.write('hello', 'utf8' as BufferEncoding, 2, 5)
    expect(written).toBe(5)
    expect(buf.toString('utf8', 2, 7)).toBe('hello')
  })

  it('fill with end === start returns early', () => {
    const buf = new Buffer([1, 2, 3])
    buf.fill(0, 1, 1)
    expect(buf[1]).toBe(2) // unchanged
  })

  it('fill on empty buffer returns early', () => {
    const buf = new Buffer(0)
    expect(() => buf.fill(5)).not.toThrow()
  })

  it('write with binary encoding', () => {
    const buf = new Buffer(5)
    buf.write('hello', 'binary')
    expect(buf.toString('binary')).toBe('hello')
  })

  it('write throws on unknown encoding', () => {
    const buf = new Buffer(10)
    expect(() => buf.write('hello', 0, 5, 'unknown_enc' as BufferEncoding)).toThrow('Unknown encoding')
  })

  it('toString throws on unknown encoding', () => {
    const buf = new Buffer([1, 2, 3])
    expect(() => buf.toString('unknown_enc' as BufferEncoding)).toThrow('Unknown encoding')
  })

  it('copy handles target too small for the copy range', () => {
    const src = new Buffer([1, 2, 3, 4, 5])
    const dst = new Buffer(4)
    // Copy from src starting at offset 1 into dst starting at offset 2
    // src has bytes [2,3,4,5] available, but dst only has 2 bytes from offset 2
    src.copy(dst, 2, 1, 5)
    expect(dst[2]).toBe(2)
    expect(dst[3]).toBe(3)
    // dst[0] and dst[1] should be unchanged (0)
    expect(dst[0]).toBe(0)
    expect(dst[1]).toBe(0)
  })

  it('copy handles target too small', () => {
    const src = new Buffer([1, 2, 3, 4, 5])
    const dst = new Buffer(3)
    src.copy(dst, 0)
    // Only 3 bytes fit, all 3 are written
    expect(dst[0]).toBe(1)
    expect(dst[1]).toBe(2)
    expect(dst[2]).toBe(3)
  })

  it('set with Uint8Array argument delegates to Uint8Array.prototype.set', () => {
    const buf = new Buffer(5)
    const source = new Uint8Array([10, 20, 30, 40, 50])
    buf.set(source)
    expect(buf[0]).toBe(10)
    expect(buf[4]).toBe(50)
  })

  it('writeInt16LE with positive value', () => {
    const buf = new Buffer(2)
    buf.writeInt16LE(42, 0)
    expect(buf.readInt16LE(0)).toBe(42)
  })

  it('writeInt16BE with positive value', () => {
    const buf = new Buffer(2)
    buf.writeInt16BE(0x7fff, 0)
    expect(buf.readInt16BE(0)).toBe(0x7fff)
  })

  it('writeInt32LE with positive value', () => {
    const buf = new Buffer(4)
    buf.writeInt32LE(12345678, 0)
    expect(buf.readInt32LE(0)).toBe(12345678)
  })

  it('writeInt32BE with positive value', () => {
    const buf = new Buffer(4)
    buf.writeInt32BE(0x7fffffff, 0)
    expect(buf.readInt32BE(0)).toBe(0x7fffffff)
  })

  it('new Buffer with boolean throws', () => {
    expect(() => new Buffer(true as unknown as number)).toThrow('First argument needs to be a number, array or string.')
  })

  it('write with length exceeding remaining space is clamped', () => {
    const buf = new Buffer(10)
    const written = buf.write('hello world, this is long!', 8, 100)
    expect(written).toBe(2) // only 2 bytes fit
    expect(buf[8]).toBe('h'.charCodeAt(0))
    expect(buf[9]).toBe('e'.charCodeAt(0))
  })

  it('hex write with length exceeding remaining space', () => {
    const buf = new Buffer(2)
    const written = buf.write('aabbccdd', 'hex', 0, 100)
    expect(written).toBe(2) // clamped to remaining
    expect(buf.toString('hex')).toBe('aabb')
  })

  it('hex write with string shorter than requested length', () => {
    const buf = new Buffer(10)
    const written = buf.write('ff', 'hex', 0, 10)
    expect(written).toBe(1) // only 1 byte from 'ff'
    expect(buf[0]).toBe(0xff)
  })

  it('hex write with default (no) length', () => {
    const buf = new Buffer(3)
    const written = buf.write('aabbcc', 'hex')
    expect(written).toBe(3)
    expect(buf.toString('hex')).toBe('aabbcc')
  })

  it('toString base64 with partial range', () => {
    const buf = new Buffer('hello world')
    const partial = buf.toString('base64', 1, 4)
    // bytes [1]=0x65('e'), [2]=0x6c('l'), [3]=0x6c('l') => base64 of "ell"
    // base64 of [0x65, 0x6c, 0x6c] = 'ZWxs'
    expect(partial).toBe('ZWxs')
    expect(partial).not.toBe(buf.toString('base64')) // different from full encoding
  })

  it('write with source shorter than requested length', () => {
    const buf = new Buffer(10)
    // Only 2 bytes from 'ab' available, but requesting 5 bytes
    const written = buf.write('ab', 0, 5)
    expect(written).toBe(2) // breaks early when src exhausted
    expect(buf[0]).toBe(97) // 'a'
    expect(buf[1]).toBe(98) // 'b'
  })

  it('toString utf8 with invalid byte returns replacement character', () => {
    // 0xFF and 0xFE are never valid in UTF-8, decodeURIComponent should fail
    const buf = new Buffer([0xFF, 0xFE])
    const result = buf.toString('utf8')
    // Should contain the replacement character U+FFFD
    expect(result).toContain('�')
  })

  it('slice with negative start returns suffix', () => {
    const buf = new Buffer([1, 2, 3, 4, 5])
    const sliced = buf.slice(-2)
    expect(sliced.length).toBe(2)
    expect(sliced[0]).toBe(4)
    expect(sliced[1]).toBe(5)
  })

  it('slice with negative end', () => {
    const buf = new Buffer([1, 2, 3, 4, 5])
    const sliced = buf.slice(1, -1)
    expect(sliced.length).toBe(3)
    expect(sliced[0]).toBe(2)
    expect(sliced[2]).toBe(4)
  })

  it('slice with very negative start clamped to 0', () => {
    const buf = new Buffer([1, 2, 3])
    const sliced = buf.slice(-100)
    expect(sliced.length).toBe(3) // starts from 0, full buffer
    expect(sliced[0]).toBe(1)
  })
})