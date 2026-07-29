/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

import * as base64 from '@yuhere/js-base64'
import * as ieee754 from '@yuhere/js-ieee754'

// console is available in both Node.js and browser runtimes,
// but not declared in ES2020 lib.
declare var console: { log(...args: unknown[]): void }

export const INSPECT_MAX_BYTES = 50

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BufferEncoding =
  | 'hex'
  | 'utf8'
  | 'utf-8'
  | 'ascii'
  | 'binary'
  | 'base64'
  | 'raw'
  | 'ucs2'
  | 'ucs-2'
  | 'utf16le'
  | 'utf-16le'

type BufferSubject =
  | number
  | string
  | ArrayLike<number>
  | ArrayBuffer
  | SharedArrayBuffer

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

function stringtrim(str: string): string {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function clamp(index: number, len: number, defaultValue: number): number {
  if (typeof index !== 'number') return defaultValue
  index = ~~index // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce(length: number): number {
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray(subject: unknown): subject is unknown[] {
  return (Array.isArray || function (subject: unknown) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish(subject: unknown): boolean {
  return isArray(subject) || Buffer.isBuffer(subject) ||
    !!(subject && typeof subject === 'object' &&
    typeof (subject as { length?: unknown }).length === 'number')
}

function toHex(n: number): string {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes(str: string): number[] {
  const byteArray: number[] = []
  for (let i = 0; i < str.length; i++) {
    const b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(str.charCodeAt(i))
    } else {
      const start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      const h = encodeURIComponent(str.slice(start, i + 1)).substr(1).split('%')
      for (let j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes(str: string): number[] {
  const byteArray: number[] = []
  for (let i = 0; i < str.length; i++) {
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes(str: string): number[] {
  const byteArray: number[] = []
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    const hi = c >> 8
    const lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }
  return byteArray
}

function base64ToBytes(str: string): Uint8Array {
  return base64.toByteArray(str)
}

function blitBuffer(src: number[] | Uint8Array, dst: Uint8Array, offset: number, length: number): number {
  let i: number
  for (i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char(str: string): string {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

// ---------------------------------------------------------------------------
// Internal read / write helpers
// ---------------------------------------------------------------------------

function _hexWrite(buf: Uint8Array, string: string, offset: number, length: number): number {
  offset = Number(offset) || 0
  let remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  const strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  let i: number
  for (i = 0; i < length; i++) {
    const byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function _utf8Write(buf: Uint8Array, string: string, offset: number, length: number): number {
  return blitBuffer(utf8ToBytes(string), buf, offset, length)
}

function _asciiWrite(buf: Uint8Array, string: string, offset: number, length: number): number {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function _binaryWrite(buf: Uint8Array, string: string, offset: number, length: number): number {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write(buf: Uint8Array, string: string, offset: number, length: number): number {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function _utf16leWrite(buf: Uint8Array, string: string, offset: number, length: number): number {
  return blitBuffer(utf16leToBytes(string), buf, offset, length)
}

// Internal slice helpers

function _base64Slice(buf: Uint8Array, start: number, end: number): string {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice(buf: Uint8Array, start: number, end: number): string {
  let res = ''
  let tmp = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice(buf: Uint8Array, start: number, end: number): string {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice(buf: Uint8Array, start: number, end: number): string {
  return _asciiSlice(buf, start, end)
}

function _hexSlice(buf: Uint8Array, start: number, end: number): string {
  const len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  let out = ''
  for (let i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice(buf: Uint8Array, start: number, end: number): string {
  const bytes = buf.slice(start, end)
  let res = ''
  for (let i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

// Internal read helpers

function _readUInt16(buf: Uint8Array, offset: number, littleEndian: boolean, noAssert?: boolean): number | undefined {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  const len = buf.length
  if (offset >= len)
    return

  let val = 0
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

function _readUInt32(buf: Uint8Array, offset: number, littleEndian: boolean, noAssert?: boolean): number | undefined {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  const len = buf.length
  if (offset >= len)
    return

  let val = 0
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

function _readInt16(buf: Uint8Array, offset: number, littleEndian: boolean, noAssert?: boolean): number | undefined {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  const len = buf.length
  if (offset >= len)
    return

  const val = _readUInt16(buf, offset, littleEndian, true)
  if (val === undefined) return
  const neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

function _readInt32(buf: Uint8Array, offset: number, littleEndian: boolean, noAssert?: boolean): number | undefined {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  const len = buf.length
  if (offset >= len)
    return

  const val = _readUInt32(buf, offset, littleEndian, true)
  if (val === undefined) return
  const neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

function _readFloat(buf: Uint8Array, offset: number, littleEndian: boolean, noAssert?: boolean): number {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

function _readDouble(buf: Uint8Array, offset: number, littleEndian: boolean, noAssert?: boolean): number {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

// Internal write helpers

function _writeUInt16(buf: Uint8Array, value: number, offset: number, littleEndian: boolean, noAssert?: boolean): void {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  const len = buf.length
  if (offset >= len)
    return

  for (let i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
      (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

function _writeUInt32(buf: Uint8Array, value: number, offset: number, littleEndian: boolean, noAssert?: boolean): void {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  const len = buf.length
  if (offset >= len)
    return

  for (let i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
      (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

function _writeInt16(buf: Uint8Array, value: number, offset: number, littleEndian: boolean, noAssert?: boolean): void {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  const len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

function _writeInt32(buf: Uint8Array, value: number, offset: number, littleEndian: boolean, noAssert?: boolean): void {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  const len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

function _writeFloat(buf: Uint8Array, value: number, offset: number, littleEndian: boolean, noAssert?: boolean): void {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  const len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

function _writeDouble(buf: Uint8Array, value: number, offset: number, littleEndian: boolean, noAssert?: boolean): void {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  const len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

// Validation helpers

function verifuint(value: number, max: number): void {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint(value: number, max: number, min: number): void {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754(value: number, max: number, min: number): void {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert(test: unknown, message?: string): asserts test {
  if (!test) throw new Error(message || 'Failed assertion')
}

// ===========================================================================
// Class: Buffer  (extends Uint8Array)
// ===========================================================================

class Buffer extends Uint8Array {
  // ---- internal marker --------------------------------------------------

  /** @internal set in constructor — checked by Buffer.isBuffer() */
  declare _isBuffer: boolean

  /** @internal legacy compat — always undefined, kept for toJSON() */
  declare _arr: Uint8Array | undefined

  // ---- static properties ------------------------------------------------

  static poolSize: number = 8192

  // ---- constructor ------------------------------------------------------

  constructor(size: number)
  constructor(array: ArrayLike<number>)
  constructor(buffer: ArrayBuffer | SharedArrayBuffer, byteOffset?: number, length?: number)
  constructor(str: string, encoding?: BufferEncoding)
  constructor(subject: BufferSubject, encoding?: number | string, noZero?: number)
  constructor(subject: BufferSubject, encoding?: number | string, noZero?: number) {
    // -- (ArrayBuffer | SharedArrayBuffer, byteOffset?, length?) ----------
    if (subject instanceof ArrayBuffer ||
        (typeof SharedArrayBuffer !== 'undefined' && subject instanceof SharedArrayBuffer)) {
      const byteOffset = typeof encoding === 'number' ? encoding : 0
      super(subject as ArrayBuffer, byteOffset, noZero)
      this._isBuffer = true
      return
    }

    const type = typeof subject

    // Workaround: node's base64 implementation allows for non-padded strings
    // while base64-js does not.
    let str = subject as string
    if (encoding === 'base64' && type === 'string') {
      str = stringtrim(str)
      while (str.length % 4 !== 0) {
        str = str + '='
      }
    }

    // Find the length
    let length: number
    if (type === 'number')
      length = coerce(subject as number)
    else if (type === 'string')
      length = Buffer.byteLength(str, encoding as string | undefined)
    else if (type === 'object')
      length = coerce((subject as ArrayLike<number>).length)
    else
      throw new Error('First argument needs to be a number, array or string.')

    // Create the underlying Uint8Array storage
    super(length)
    this._isBuffer = true

    const obj = subject as ArrayLike<number> & { byteLength?: number }
    if (typeof obj.byteLength === 'number') {
      // Speed optimization -- use set if we're copying from a typed array
      Uint8Array.prototype.set.call(this, obj)
    } else if (isArrayish(subject)) {
      // Treat array-ish objects as a byte array
      for (let i = 0; i < length; i++) {
        if (Buffer.isBuffer(subject))
          this[i] = (subject as Buffer).readUInt8(i)!
        else
          this[i] = obj[i]
      }
    } else if (type === 'string') {
      // Legacy 3-arg form: write(string, offset, encoding).
      // The method internally detects the legacy signature and swaps args.
      ;(this as any).write(str, 0, encoding)
    }
  }

  // ---- static methods ---------------------------------------------------

  static isEncoding(encoding: string): boolean {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'binary':
      case 'base64':
      case 'raw':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  }

  static isBuffer(b: unknown): b is Buffer {
    return !!(b !== null && b !== undefined && (b as Buffer)._isBuffer)
  }

  static byteLength(str: string, encoding?: string): number {
    let ret = 0
    str = str + ''
    switch (encoding || 'utf8') {
      case 'hex':
        ret = str.length / 2
        break
      case 'utf8':
      case 'utf-8':
        ret = utf8ToBytes(str).length
        break
      case 'ascii':
      case 'binary':
      case 'raw':
        ret = str.length
        break
      case 'base64':
        ret = base64ToBytes(str).length
        break
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        ret = str.length * 2
        break
      default:
        throw new Error('Unknown encoding')
    }
    return ret
  }

  static concat(list: Uint8Array[], totalLength?: number): Buffer {
    assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

    if (list.length === 0) {
      return new Buffer(0)
    } else if (list.length === 1) {
      return list[0] as Buffer
    }

    let i: number
    if (typeof totalLength !== 'number') {
      totalLength = 0
      for (i = 0; i < list.length; i++) {
        totalLength += list[i].length
      }
    }

    const buf = new Buffer(totalLength)
    let pos = 0
    for (i = 0; i < list.length; i++) {
      const item = list[i]
      ;(item as Buffer).copy(buf, pos)
      pos += item.length
    }
    return buf
  }

  // ---- instance methods -------------------------------------------------

  // Modern:  write(string, offset?, length?, encoding?)
  // Legacy:  write(string, encoding?, offset?, length?)
  write(string: string, offset?: number, length?: number, encoding?: BufferEncoding): number
  write(string: string, encoding?: BufferEncoding, offset?: number, length?: number): number
  write(string: string, offset?: number | string, length?: number, encoding?: BufferEncoding | number): number {
    // Support both (string, offset, length, encoding)
    // and the legacy (string, encoding, offset, length)
    if (isFinite(offset as number)) {
      if (!isFinite(length as number)) {
        encoding = length as BufferEncoding | undefined
        length = undefined
      }
    } else {  // legacy
      const swap = encoding
      encoding = offset as BufferEncoding | undefined
      offset = length as number | undefined
      length = swap as number | undefined
    }

    let off = Number(offset) || 0
    const remaining = this.length - off
    let len: number
    if (!length) {
      len = remaining
    } else {
      len = Number(length)
      if (len > remaining) {
        len = remaining
      }
    }
    const enc = String(encoding || 'utf8').toLowerCase()

    let ret: number
    switch (enc) {
      case 'hex':
        ret = _hexWrite(this, string, off, len)
        break
      case 'utf8':
      case 'utf-8':
        ret = _utf8Write(this, string, off, len)
        break
      case 'ascii':
        ret = _asciiWrite(this, string, off, len)
        break
      case 'binary':
        ret = _binaryWrite(this, string, off, len)
        break
      case 'base64':
        ret = _base64Write(this, string, off, len)
        break
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        ret = _utf16leWrite(this, string, off, len)
        break
      default:
        throw new Error('Unknown encoding')
    }
    return ret
  }

  toString(encoding?: BufferEncoding, start?: number, end?: number): string {
    const enc = String(encoding || 'utf8').toLowerCase()
    let s = Number(start) || 0
    let e = (end !== undefined)
      ? Number(end)
      : this.length

    // Fastpath empty strings
    if (e === s)
      return ''

    let ret: string
    switch (enc) {
      case 'hex':
        ret = _hexSlice(this, s, e)
        break
      case 'utf8':
      case 'utf-8':
        ret = _utf8Slice(this, s, e)
        break
      case 'ascii':
        ret = _asciiSlice(this, s, e)
        break
      case 'binary':
        ret = _binarySlice(this, s, e)
        break
      case 'base64':
        ret = _base64Slice(this, s, e)
        break
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        ret = _utf16leSlice(this, s, e)
        break
      default:
        throw new Error('Unknown encoding')
    }
    return ret
  }

  toJSON(): { type: 'Buffer'; data: number[] } {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  }

  copy(target: Uint8Array, target_start?: number, start?: number, end?: number): void {
    if (!start) start = 0
    if (!end && end !== 0) end = this.length
    if (!target_start) target_start = 0

    // Copy 0 bytes; we're done
    if (end === start) return
    if (target.length === 0 || this.length === 0) return

    // Fatal error conditions
    assert(end >= start, 'sourceEnd < sourceStart')
    assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
    assert(start >= 0 && start < this.length, 'sourceStart out of bounds')
    assert(end >= 0 && end <= this.length, 'sourceEnd out of bounds')

    // Are we oob?
    let e = end
    if (e > this.length)
      e = this.length
    if (target.length - target_start < e - start)
      e = target.length - target_start + start

    const len = e - start

    if (len < 100) {
      for (let i = 0; i < len; i++)
        target[i + target_start] = this[i + start]
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, start + len), target_start)
    }
  }

  slice(start?: number, end?: number): Buffer {
    const len = this.length
    const s = clamp(start as number, len, 0)
    const e = clamp(end as number, len, len)

    return this.subarray(s, e) as Buffer
  }

  // ---- deprecated methods (shadow Uint8Array.prototype.get/set) ---------

  /** @deprecated Use array indexes instead. */
  get(offset: number): number | undefined {
    console.log('.get() is deprecated. Access using array indexes instead.')
    return this.readUInt8(offset)
  }

  /** @deprecated Use array indexes instead. */
  set(v: number, offset?: number): void
  /** Matches Uint8Array.prototype.set for type compatibility. */
  set(array: ArrayLike<number>, offset?: number): void
  set(v: number | ArrayLike<number>, offset?: number): void {
    if (typeof v === 'number') {
      console.log('.set() is deprecated. Access using array indexes instead.')
      this.writeUInt8(v, offset as number)
    } else {
      Uint8Array.prototype.set.call(this, v, offset)
    }
  }

  // ---- read methods -----------------------------------------------------

  readUInt8(offset: number, noAssert?: boolean): number | undefined {
    if (!noAssert) {
      assert(offset !== undefined && offset !== null, 'missing offset')
      assert(offset < this.length, 'Trying to read beyond buffer length')
    }

    if (offset >= this.length)
      return

    return this[offset]
  }

  readUInt16LE(offset: number, noAssert?: boolean): number | undefined {
    return _readUInt16(this, offset, true, noAssert)
  }

  readUInt16BE(offset: number, noAssert?: boolean): number | undefined {
    return _readUInt16(this, offset, false, noAssert)
  }

  readUInt32LE(offset: number, noAssert?: boolean): number | undefined {
    return _readUInt32(this, offset, true, noAssert)
  }

  readUInt32BE(offset: number, noAssert?: boolean): number | undefined {
    return _readUInt32(this, offset, false, noAssert)
  }

  readInt8(offset: number, noAssert?: boolean): number | undefined {
    if (!noAssert) {
      assert(offset !== undefined && offset !== null, 'missing offset')
      assert(offset < this.length, 'Trying to read beyond buffer length')
    }

    if (offset >= this.length)
      return

    const neg = this[offset] & 0x80
    if (neg)
      return (0xff - this[offset] + 1) * -1
    else
      return this[offset]
  }

  readInt16LE(offset: number, noAssert?: boolean): number | undefined {
    return _readInt16(this, offset, true, noAssert)
  }

  readInt16BE(offset: number, noAssert?: boolean): number | undefined {
    return _readInt16(this, offset, false, noAssert)
  }

  readInt32LE(offset: number, noAssert?: boolean): number | undefined {
    return _readInt32(this, offset, true, noAssert)
  }

  readInt32BE(offset: number, noAssert?: boolean): number | undefined {
    return _readInt32(this, offset, false, noAssert)
  }

  readFloatLE(offset: number, noAssert?: boolean): number {
    return _readFloat(this, offset, true, noAssert)
  }

  readFloatBE(offset: number, noAssert?: boolean): number {
    return _readFloat(this, offset, false, noAssert)
  }

  readDoubleLE(offset: number, noAssert?: boolean): number {
    return _readDouble(this, offset, true, noAssert)
  }

  readDoubleBE(offset: number, noAssert?: boolean): number {
    return _readDouble(this, offset, false, noAssert)
  }

  // ---- write methods ----------------------------------------------------

  writeUInt8(value: number, offset: number, noAssert?: boolean): void {
    if (!noAssert) {
      assert(value !== undefined && value !== null, 'missing value')
      assert(offset !== undefined && offset !== null, 'missing offset')
      assert(offset < this.length, 'trying to write beyond buffer length')
      verifuint(value, 0xff)
    }

    if (offset >= this.length) return

    this[offset] = value
  }

  writeUInt16LE(value: number, offset: number, noAssert?: boolean): void {
    _writeUInt16(this, value, offset, true, noAssert)
  }

  writeUInt16BE(value: number, offset: number, noAssert?: boolean): void {
    _writeUInt16(this, value, offset, false, noAssert)
  }

  writeUInt32LE(value: number, offset: number, noAssert?: boolean): void {
    _writeUInt32(this, value, offset, true, noAssert)
  }

  writeUInt32BE(value: number, offset: number, noAssert?: boolean): void {
    _writeUInt32(this, value, offset, false, noAssert)
  }

  writeInt8(value: number, offset: number, noAssert?: boolean): void {
    if (!noAssert) {
      assert(value !== undefined && value !== null, 'missing value')
      assert(offset !== undefined && offset !== null, 'missing offset')
      assert(offset < this.length, 'Trying to write beyond buffer length')
      verifsint(value, 0x7f, -0x80)
    }

    if (offset >= this.length)
      return

    if (value >= 0)
      this.writeUInt8(value, offset, noAssert)
    else
      this.writeUInt8(0xff + value + 1, offset, noAssert)
  }

  writeInt16LE(value: number, offset: number, noAssert?: boolean): void {
    _writeInt16(this, value, offset, true, noAssert)
  }

  writeInt16BE(value: number, offset: number, noAssert?: boolean): void {
    _writeInt16(this, value, offset, false, noAssert)
  }

  writeInt32LE(value: number, offset: number, noAssert?: boolean): void {
    _writeInt32(this, value, offset, true, noAssert)
  }

  writeInt32BE(value: number, offset: number, noAssert?: boolean): void {
    _writeInt32(this, value, offset, false, noAssert)
  }

  writeFloatLE(value: number, offset: number, noAssert?: boolean): void {
    _writeFloat(this, value, offset, true, noAssert)
  }

  writeFloatBE(value: number, offset: number, noAssert?: boolean): void {
    _writeFloat(this, value, offset, false, noAssert)
  }

  writeDoubleLE(value: number, offset: number, noAssert?: boolean): void {
    _writeDouble(this, value, offset, true, noAssert)
  }

  writeDoubleBE(value: number, offset: number, noAssert?: boolean): void {
    _writeDouble(this, value, offset, false, noAssert)
  }

  // ---- utility methods --------------------------------------------------

  fill(value?: number | string, start?: number, end?: number): this {
    let v = value
    if (!v) v = 0
    let s = start
    if (!s) s = 0
    let e = end
    if (!e) e = this.length

    if (typeof v === 'string') {
      v = v.charCodeAt(0)
    }

    assert(typeof v === 'number' && !isNaN(v), 'value is not a number')
    assert(e >= s, 'end < start')

    // Fill 0 bytes; we're done
    if (e === s) return this
    if (this.length === 0) return this

    assert(s >= 0 && s < this.length, 'start out of bounds')
    assert(e >= 0 && e <= this.length, 'end out of bounds')

    for (let i = s; i < e; i++) {
      this[i] = v
    }
    return this
  }

  inspect(): string {
    const out: string[] = []
    const len = this.length
    for (let i = 0; i < len; i++) {
      out[i] = toHex(this[i])
      if (i === INSPECT_MAX_BYTES) {
        out[i + 1] = '...'
        break
      }
    }
    return '<Buffer ' + out.join(' ') + '>'
  }

  toArrayBuffer(): ArrayBuffer {
    return (new Buffer(this)).buffer
  }
}

// Export both Buffer and the SlowBuffer alias (identical in this
// implementation — Node.js uses SlowBuffer for un-pooled allocations).
export { Buffer, Buffer as SlowBuffer }
