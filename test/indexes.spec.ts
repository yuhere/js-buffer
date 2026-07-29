/// <reference types="vitest/globals" />

import { Buffer as B } from '../src/index.ts'

describe('buffer indexes', function () {
  it('from a string', function () {
    const buf = new B('abc')
    expect(buf[0]).toBe(97)
    expect(buf[1]).toBe(98)
    expect(buf[2]).toBe(99)
  })

  it('from an array', function () {
    const buf = new B([97, 98, 99])
    expect(buf[0]).toBe(97)
    expect(buf[1]).toBe(98)
    expect(buf[2]).toBe(99)
  })

  it('set then modify indexes from an array', function () {
    const buf = new B([97, 98, 99])
    expect(buf[2]).toBe(99)
    expect(buf.toString()).toBe('abc')

    buf[2] += 10
    expect(buf[2]).toBe(109)
    expect(buf.toString()).toBe('abm')
  })
})
