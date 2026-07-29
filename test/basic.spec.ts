/// <reference types="vitest/globals" />
import { Buffer as B } from '../src/index.ts'

describe('new buffer', function () {
  it('from array', function () {
    expect(new B([1, 2, 3]).toString()).toBe('\x01\x02\x03')
  })

  it('from string', function () {
    expect(new B('hey', 'utf8').toString()).toBe('hey')
  })

  it('from buffer', function () {
    const b1 = new B('asdf')
    const b2 = new B(b1)
    expect(b1.toString('hex')).toBe(b2.toString('hex'))
  })

  it('from uint8array', function () {
    if (typeof Uint8Array !== 'undefined') {
      const b1 = new Uint8Array([0, 1, 2, 3])
      const b2 = new B(b1)
      expect(b1.length).toBe(b2.length)
      expect(b1[0]).toBe(0)
      expect(b1[1]).toBe(1)
      expect(b1[2]).toBe(2)
      expect(b1[3]).toBe(3)
      expect(b1[4]).toBe(undefined)
    }
  })

  it('from uint16array', function () {
    if (typeof Uint16Array !== 'undefined') {
      const b1 = new Uint16Array([0, 1, 2, 3])
      const b2 = new B(b1)
      expect(b1.length).toBe(b2.length)
      expect(b1[0]).toBe(0)
      expect(b1[1]).toBe(1)
      expect(b1[2]).toBe(2)
      expect(b1[3]).toBe(3)
      expect(b1[4]).toBe(undefined)
    }
  })

  it('from uint32array', function () {
    if (typeof Uint32Array !== 'undefined') {
      const b1 = new Uint32Array([0, 1, 2, 3])
      const b2 = new B(b1)
      expect(b1.length).toBe(b2.length)
      expect(b1[0]).toBe(0)
      expect(b1[1]).toBe(1)
      expect(b1[2]).toBe(2)
      expect(b1[3]).toBe(3)
      expect(b1[4]).toBe(undefined)
    }
  })

  it('from int16array', function () {
    if (typeof Int16Array !== 'undefined') {
      const b1 = new Int16Array([0, 1, 2, 3])
      const b2 = new B(b1)
      expect(b1.length).toBe(b2.length)
      expect(b1[0]).toBe(0)
      expect(b1[1]).toBe(1)
      expect(b1[2]).toBe(2)
      expect(b1[3]).toBe(3)
      expect(b1[4]).toBe(undefined)
    }
  })

  it('from int32array', function () {
    if (typeof Int32Array !== 'undefined') {
      const b1 = new Int32Array([0, 1, 2, 3])
      const b2 = new B(b1)
      expect(b1.length).toBe(b2.length)
      expect(b1[0]).toBe(0)
      expect(b1[1]).toBe(1)
      expect(b1[2]).toBe(2)
      expect(b1[3]).toBe(3)
      expect(b1[4]).toBe(undefined)
    }
  })

  it('from float32array', function () {
    if (typeof Float32Array !== 'undefined') {
      const b1 = new Float32Array([0, 1, 2, 3])
      const b2 = new B(b1)
      expect(b1.length).toBe(b2.length)
      expect(b1[0]).toBe(0)
      expect(b1[1]).toBe(1)
      expect(b1[2]).toBe(2)
      expect(b1[3]).toBe(3)
      expect(b1[4]).toBe(undefined)
    }
  })

  it('from float64array', function () {
    if (typeof Float64Array !== 'undefined') {
      const b1 = new Float64Array([0, 1, 2, 3])
      const b2 = new B(b1)
      expect(b1.length).toBe(b2.length)
      expect(b1[0]).toBe(0)
      expect(b1[1]).toBe(1)
      expect(b1[2]).toBe(2)
      expect(b1[3]).toBe(3)
      expect(b1[4]).toBe(undefined)
    }
  })
})

describe('buffer toArrayBuffer()', function () {
  it('should convert to ArrayBuffer', function () {
    const data = [1, 2, 3, 4, 5, 6, 7, 8]
    if (typeof Uint8Array !== 'undefined') {
      const result = new B(data).toArrayBuffer()
      const expected = new Uint8Array(data).buffer
      for (let i = 0; i < expected.byteLength; i++) {
        expect(result[i]).toBe(expected[i])
      }
    } else {
      // No toArrayBuffer() method provided in old browsers
      expect(true).toBeTruthy()
    }
  })
})

describe('buffer toJSON()', function () {
  it('should return JSON representation', function () {
    const data = [1, 2, 3, 4]
    expect(new B(data).toJSON()).toStrictEqual({ type: 'Buffer', data: [1, 2, 3, 4] })
  })
})

describe('buffer copy', function () {
  it('should copy within bounds', function () {
    const buf1 = new B(26)
    const buf2 = new B(26)

    for (let i = 0; i < 26; i++) {
      buf1[i] = i + 97 // 97 is ASCII a
      buf2[i] = 33 // ASCII !
    }

    buf1.copy(buf2, 8, 16, 20)

    expect(buf2.toString('ascii', 0, 25)).toBe('!!!!!!!!qrst!!!!!!!!!!!!!')
  })
})
