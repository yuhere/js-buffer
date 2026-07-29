/// <reference types="vitest/globals" />

import { Buffer as B } from '../src/index.ts'

describe('buffer encoding', function () {
  it('utf8 buffer to base64', function () {
    expect(new B('Ձאab', 'utf8').toString('base64')).toBe('1YHXkGFi')
  })

  it('utf8 buffer to hex', function () {
    expect(new B('Ձאab', 'utf8').toString('hex')).toBe('d581d7906162')
  })

  it('utf8 to utf8', function () {
    expect(new B('öäüõÖÄÜÕ', 'utf8').toString('utf8')).toBe('öäüõÖÄÜÕ')
  })

  it('utf16le to utf16', function () {
    expect(new B(new B('abcd', 'utf8').toString('utf16le'), 'utf16le').toString('utf8')).toBe('abcd')
  })

  it('utf16le to hex', function () {
    expect(new B('abcd', 'utf16le').toString('hex')).toBe('6100620063006400')
  })

  it('ascii buffer to base64', function () {
    expect(new B('123456!@#$%^', 'ascii').toString('base64')).toBe('MTIzNDU2IUAjJCVe')
  })

  it('ascii buffer to hex', function () {
    expect(new B('123456!@#$%^', 'ascii').toString('hex')).toBe('31323334353621402324255e')
  })

  it('base64 buffer to utf8', function () {
    expect(new B('1YHXkGFi', 'base64').toString('utf8')).toBe('Ձאab')
  })

  it('hex buffer to utf8', function () {
    expect(new B('d581d7906162', 'hex').toString('utf8')).toBe('Ձאab')
  })

  it('base64 buffer to ascii', function () {
    expect(new B('MTIzNDU2IUAjJCVe', 'base64').toString('ascii')).toBe('123456!@#$%^')
  })

  it('hex buffer to ascii', function () {
    expect(new B('31323334353621402324255e', 'hex').toString('ascii')).toBe('123456!@#$%^')
  })

  it('base64 buffer to binary', function () {
    expect(new B('MTIzNDU2IUAjJCVe', 'base64').toString('binary')).toBe('123456!@#$%^')
  })

  it('hex buffer to binary', function () {
    expect(new B('31323334353621402324255e', 'hex').toString('binary')).toBe('123456!@#$%^')
  })

  it('utf8 to binary', function () {
    expect(new B('öäüõÖÄÜÕ', 'utf8').toString('binary')).toBe('Ã¶Ã¤Ã¼ÃµÃ\x96Ã\x84Ã\x9CÃ\x95')
  })
})

describe('hex of write{Uint,Int}{8,16,32}{LE,BE}', function () {
  it('should write and read correctly', function () {
    const hex = [
      '03', '0300', '0003', '03000000', '00000003',
      'fd', 'fdff', 'fffd', 'fdffffff', 'fffffffd'
    ]
    const reads = [3, 3, 3, 3, 3, -3, -3, -3, -3, -3]
    const xs = ['UInt', 'Int'] as const
    const ys = [8, 16, 32]
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i]
      for (let j = 0; j < ys.length; j++) {
        const y = ys[j]
        const endianesses = (y === 8) ? [''] : ['LE', 'BE']
        for (let k = 0; k < endianesses.length; k++) {
          const z = endianesses[k]

          const v1 = new B(y / 8)
          const writefn = 'write' + x + y + z as keyof B
          const val = (x === 'Int') ? -3 : 3
          ;(v1[writefn] as Function)(val, 0)
          expect(v1.toString('hex')).toBe(hex.shift())
          const readfn = 'read' + x + y + z as keyof B
          expect((v1[readfn] as Function)(0)).toBe(reads.shift())
        }
      }
    }
  })
})

describe('hex of write{Uint,Int}{8,16,32}{LE,BE} with overflow', function () {
  it('should handle overflow correctly', function () {
    const hex = [
      '', '03', '00', '030000', '000000',
      '', 'fd', 'ff', 'fdffff', 'ffffff'
    ]
    const reads = [
      undefined, 3, 0, 3, 0,
      undefined, 253, -256, 16777213, -256
    ]
    const xs = ['UInt', 'Int'] as const
    const ys = [8, 16, 32]
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i]
      for (let j = 0; j < ys.length; j++) {
        const y = ys[j]
        const endianesses = (y === 8) ? [''] : ['LE', 'BE']
        for (let k = 0; k < endianesses.length; k++) {
          const z = endianesses[k]

          const v1 = new B(y / 8 - 1)
          const next = new B(4)
          next.writeUInt32BE(0, 0)
          const writefn = 'write' + x + y + z as keyof B
          const val = (x === 'Int') ? -3 : 3
          ;(v1[writefn] as Function)(val, 0, true)
          expect(v1.toString('hex')).toBe(hex.shift())
          // check that nothing leaked to next buffer.
          expect(next.readUInt32BE(0)).toBe(0)
          // check that no bytes are read from next buffer.
          next.writeInt32BE(~0, 0)
          const readfn = 'read' + x + y + z as keyof B
          expect((v1[readfn] as Function)(0, true)).toBe(reads.shift())
        }
      }
    }
  })
})

describe('Buffer.concat()', function () {
  it('should concat a varying number of buffers', function () {
    const zero: B[] = []
    const one = [new B('asdf')]
    const long: B[] = []
    for (let i = 0; i < 10; i++) long.push(new B('asdf'))

    const flatZero = B.concat(zero)
    const flatOne = B.concat(one)
    const flatLong = B.concat(long)
    const flatLongLen = B.concat(long, 40)

    expect(flatZero.length).toBe(0)
    expect(flatOne.toString()).toBe('asdf')
    expect(flatOne).toBe(one[0])
    expect(flatLong.toString()).toBe((new Array(10 + 1).join('asdf')))
    expect(flatLongLen.toString()).toBe((new Array(10 + 1).join('asdf')))
  })
})

describe('buffer fill', function () {
  it('should fill buffer with value', function () {
    const b = new B(10)
    b.fill(2)
    expect(b.toString('hex')).toBe('02020202020202020202')
  })
})

describe('buffer copy()', function () {
  it('empty buffer with sourceEnd=0', function () {
    const source = new B([42])
    const destination = new B([43])
    source.copy(destination, 0, 0, 0)
    expect(destination.readUInt8(0)).toBe(43)
  })

  it('after slice()', function () {
    const source = new B(200)
    const dest = new B(200)
    const expected = new B(200)
    for (let i = 0; i < 200; i++) {
      source[i] = i
      dest[i] = 0
    }

    source.slice(2).copy(dest)
    source.copy(expected, 0, 2)
    expect(dest).toStrictEqual(expected)
  })
})

describe('base64', function () {
  it('should ignore whitespace', function () {
    const text = '\n   YW9ldQ==  '
    const buf = new B(text, 'base64')
    expect(buf.toString()).toBe('aoeu')
  })

  it('should handle strings without padding', function () {
    expect((new B('YW9ldQ', 'base64').toString())).toBe('aoeu')
  })
})

describe('buffer.slice', function () {
  it('sets indexes', function () {
    expect((new B('hallo')).slice(0, 5).toString()).toBe('hallo')
  })

  it('out of range', function () {
    expect((new B('hallo')).slice(0, 10).toString()).toBe('hallo')
    expect((new B('hallo')).slice(10, 2).toString()).toBe('')
  })
})
