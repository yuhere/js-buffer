import * as base64 from "@yuhere/js-base64";
import * as ieee754 from "@yuhere/js-ieee754";
//#region src/index.ts
/*!
* The buffer module from node.js, for the browser.
*
* @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
* @license  MIT
*/
var INSPECT_MAX_BYTES = 50;
function stringtrim(str) {
	if (str.trim) return str.trim();
	return str.replace(/^\s+|\s+$/g, "");
}
function clamp(index, len, defaultValue) {
	if (typeof index !== "number") return defaultValue;
	index = ~~index;
	if (index >= len) return len;
	if (index >= 0) return index;
	index += len;
	if (index >= 0) return index;
	return 0;
}
function coerce(length) {
	length = ~~Math.ceil(+length);
	return length < 0 ? 0 : length;
}
function isArray(subject) {
	return (Array.isArray || function(subject) {
		return Object.prototype.toString.call(subject) === "[object Array]";
	})(subject);
}
function isArrayish(subject) {
	return isArray(subject) || Buffer.isBuffer(subject) || !!(subject && typeof subject === "object" && typeof subject.length === "number");
}
function toHex(n) {
	if (n < 16) return "0" + n.toString(16);
	return n.toString(16);
}
function utf8ToBytes(str) {
	const byteArray = [];
	for (let i = 0; i < str.length; i++) {
		const b = str.charCodeAt(i);
		if (b <= 127) byteArray.push(str.charCodeAt(i));
		else {
			const start = i;
			if (b >= 55296 && b <= 57343) i++;
			const h = encodeURIComponent(str.slice(start, i + 1)).substr(1).split("%");
			for (let j = 0; j < h.length; j++) byteArray.push(parseInt(h[j], 16));
		}
	}
	return byteArray;
}
function asciiToBytes(str) {
	const byteArray = [];
	for (let i = 0; i < str.length; i++) byteArray.push(str.charCodeAt(i) & 255);
	return byteArray;
}
function utf16leToBytes(str) {
	const byteArray = [];
	for (let i = 0; i < str.length; i++) {
		const c = str.charCodeAt(i);
		const hi = c >> 8;
		const lo = c % 256;
		byteArray.push(lo);
		byteArray.push(hi);
	}
	return byteArray;
}
function base64ToBytes(str) {
	return base64.toByteArray(str);
}
function blitBuffer(src, dst, offset, length) {
	let i;
	for (i = 0; i < length; i++) {
		if (i + offset >= dst.length || i >= src.length) break;
		dst[i + offset] = src[i];
	}
	return i;
}
function decodeUtf8Char(str) {
	try {
		return decodeURIComponent(str);
	} catch (err) {
		return String.fromCharCode(65533);
	}
}
function _hexWrite(buf, string, offset, length) {
	offset = Number(offset) || 0;
	let remaining = buf.length - offset;
	if (!length) length = remaining;
	else {
		length = Number(length);
		if (length > remaining) length = remaining;
	}
	const strLen = string.length;
	assert(strLen % 2 === 0, "Invalid hex string");
	if (length > strLen / 2) length = strLen / 2;
	let i;
	for (i = 0; i < length; i++) {
		const byte = parseInt(string.substr(i * 2, 2), 16);
		assert(!isNaN(byte), "Invalid hex string");
		buf[offset + i] = byte;
	}
	return i;
}
function _utf8Write(buf, string, offset, length) {
	return blitBuffer(utf8ToBytes(string), buf, offset, length);
}
function _asciiWrite(buf, string, offset, length) {
	return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function _binaryWrite(buf, string, offset, length) {
	return _asciiWrite(buf, string, offset, length);
}
function _base64Write(buf, string, offset, length) {
	return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function _utf16leWrite(buf, string, offset, length) {
	return blitBuffer(utf16leToBytes(string), buf, offset, length);
}
function _base64Slice(buf, start, end) {
	if (start === 0 && end === buf.length) return base64.fromByteArray(buf);
	else return base64.fromByteArray(buf.slice(start, end));
}
function _utf8Slice(buf, start, end) {
	let res = "";
	let tmp = "";
	end = Math.min(buf.length, end);
	for (let i = start; i < end; i++) if (buf[i] <= 127) {
		res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i]);
		tmp = "";
	} else tmp += "%" + buf[i].toString(16);
	return res + decodeUtf8Char(tmp);
}
function _asciiSlice(buf, start, end) {
	let ret = "";
	end = Math.min(buf.length, end);
	for (let i = start; i < end; i++) ret += String.fromCharCode(buf[i]);
	return ret;
}
function _binarySlice(buf, start, end) {
	return _asciiSlice(buf, start, end);
}
function _hexSlice(buf, start, end) {
	const len = buf.length;
	if (!start || start < 0) start = 0;
	if (!end || end < 0 || end > len) end = len;
	let out = "";
	for (let i = start; i < end; i++) out += toHex(buf[i]);
	return out;
}
function _utf16leSlice(buf, start, end) {
	const bytes = buf.slice(start, end);
	let res = "";
	for (let i = 0; i < bytes.length; i += 2) res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	return res;
}
function _readUInt16(buf, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 1 < buf.length, "Trying to read beyond buffer length");
	}
	const len = buf.length;
	if (offset >= len) return;
	let val = 0;
	if (littleEndian) {
		val = buf[offset];
		if (offset + 1 < len) val |= buf[offset + 1] << 8;
	} else {
		val = buf[offset] << 8;
		if (offset + 1 < len) val |= buf[offset + 1];
	}
	return val;
}
function _readUInt32(buf, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 3 < buf.length, "Trying to read beyond buffer length");
	}
	const len = buf.length;
	if (offset >= len) return;
	let val = 0;
	if (littleEndian) {
		if (offset + 2 < len) val = buf[offset + 2] << 16;
		if (offset + 1 < len) val |= buf[offset + 1] << 8;
		val |= buf[offset];
		if (offset + 3 < len) val = val + (buf[offset + 3] << 24 >>> 0);
	} else {
		if (offset + 1 < len) val = buf[offset + 1] << 16;
		if (offset + 2 < len) val |= buf[offset + 2] << 8;
		if (offset + 3 < len) val |= buf[offset + 3];
		val = val + (buf[offset] << 24 >>> 0);
	}
	return val;
}
function _readInt16(buf, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 1 < buf.length, "Trying to read beyond buffer length");
	}
	if (offset >= buf.length) return;
	const val = _readUInt16(buf, offset, littleEndian, true);
	if (val === void 0) return;
	if (val & 32768) return (65535 - val + 1) * -1;
	else return val;
}
function _readInt32(buf, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 3 < buf.length, "Trying to read beyond buffer length");
	}
	if (offset >= buf.length) return;
	const val = _readUInt32(buf, offset, littleEndian, true);
	if (val === void 0) return;
	if (val & 2147483648) return (4294967295 - val + 1) * -1;
	else return val;
}
function _readFloat(buf, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset + 3 < buf.length, "Trying to read beyond buffer length");
	}
	return ieee754.read(buf, offset, littleEndian, 23, 4);
}
function _readDouble(buf, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset + 7 < buf.length, "Trying to read beyond buffer length");
	}
	return ieee754.read(buf, offset, littleEndian, 52, 8);
}
function _writeUInt16(buf, value, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(value !== void 0 && value !== null, "missing value");
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 1 < buf.length, "trying to write beyond buffer length");
		verifuint(value, 65535);
	}
	const len = buf.length;
	if (offset >= len) return;
	for (let i = 0, j = Math.min(len - offset, 2); i < j; i++) buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
}
function _writeUInt32(buf, value, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(value !== void 0 && value !== null, "missing value");
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 3 < buf.length, "trying to write beyond buffer length");
		verifuint(value, 4294967295);
	}
	const len = buf.length;
	if (offset >= len) return;
	for (let i = 0, j = Math.min(len - offset, 4); i < j; i++) buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
}
function _writeInt16(buf, value, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(value !== void 0 && value !== null, "missing value");
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 1 < buf.length, "Trying to write beyond buffer length");
		verifsint(value, 32767, -32768);
	}
	if (offset >= buf.length) return;
	if (value >= 0) _writeUInt16(buf, value, offset, littleEndian, noAssert);
	else _writeUInt16(buf, 65535 + value + 1, offset, littleEndian, noAssert);
}
function _writeInt32(buf, value, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(value !== void 0 && value !== null, "missing value");
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 3 < buf.length, "Trying to write beyond buffer length");
		verifsint(value, 2147483647, -2147483648);
	}
	if (offset >= buf.length) return;
	if (value >= 0) _writeUInt32(buf, value, offset, littleEndian, noAssert);
	else _writeUInt32(buf, 4294967295 + value + 1, offset, littleEndian, noAssert);
}
function _writeFloat(buf, value, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(value !== void 0 && value !== null, "missing value");
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 3 < buf.length, "Trying to write beyond buffer length");
		verifIEEE754(value, 34028234663852886e22, -34028234663852886e22);
	}
	if (offset >= buf.length) return;
	ieee754.write(buf, value, offset, littleEndian, 23, 4);
}
function _writeDouble(buf, value, offset, littleEndian, noAssert) {
	if (!noAssert) {
		assert(value !== void 0 && value !== null, "missing value");
		assert(typeof littleEndian === "boolean", "missing or invalid endian");
		assert(offset !== void 0 && offset !== null, "missing offset");
		assert(offset + 7 < buf.length, "Trying to write beyond buffer length");
		verifIEEE754(value, 17976931348623157e292, -17976931348623157e292);
	}
	if (offset >= buf.length) return;
	ieee754.write(buf, value, offset, littleEndian, 52, 8);
}
function verifuint(value, max) {
	assert(typeof value === "number", "cannot write a non-number as a number");
	assert(value >= 0, "specified a negative value for writing an unsigned value");
	assert(value <= max, "value is larger than maximum value for type");
	assert(Math.floor(value) === value, "value has a fractional component");
}
function verifsint(value, max, min) {
	assert(typeof value === "number", "cannot write a non-number as a number");
	assert(value <= max, "value larger than maximum allowed value");
	assert(value >= min, "value smaller than minimum allowed value");
	assert(Math.floor(value) === value, "value has a fractional component");
}
function verifIEEE754(value, max, min) {
	assert(typeof value === "number", "cannot write a non-number as a number");
	assert(value <= max, "value larger than maximum allowed value");
	assert(value >= min, "value smaller than minimum allowed value");
}
function assert(test, message) {
	if (!test) throw new Error(message || "Failed assertion");
}
var Buffer = class Buffer extends Uint8Array {
	static {
		this.poolSize = 8192;
	}
	constructor(subject, encoding, noZero) {
		if (subject instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && subject instanceof SharedArrayBuffer) {
			super(subject, typeof encoding === "number" ? encoding : 0, noZero);
			this._isBuffer = true;
			return;
		}
		const type = typeof subject;
		let str = subject;
		if (encoding === "base64" && type === "string") {
			str = stringtrim(str);
			while (str.length % 4 !== 0) str = str + "=";
		}
		let length;
		if (type === "number") length = coerce(subject);
		else if (type === "string") length = Buffer.byteLength(str, encoding);
		else if (type === "object") length = coerce(subject.length);
		else throw new Error("First argument needs to be a number, array or string.");
		super(length);
		this._isBuffer = true;
		const obj = subject;
		if (typeof obj.byteLength === "number") Uint8Array.prototype.set.call(this, obj);
		else if (isArrayish(subject)) for (let i = 0; i < length; i++) if (Buffer.isBuffer(subject)) this[i] = subject.readUInt8(i);
		else this[i] = obj[i];
		else if (type === "string") this.write(str, 0, encoding);
	}
	static isEncoding(encoding) {
		switch (String(encoding).toLowerCase()) {
			case "hex":
			case "utf8":
			case "utf-8":
			case "ascii":
			case "binary":
			case "base64":
			case "raw":
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return true;
			default: return false;
		}
	}
	static isBuffer(b) {
		return !!(b !== null && b !== void 0 && b._isBuffer);
	}
	static byteLength(str, encoding) {
		let ret = 0;
		str = str + "";
		switch (encoding || "utf8") {
			case "hex":
				ret = str.length / 2;
				break;
			case "utf8":
			case "utf-8":
				ret = utf8ToBytes(str).length;
				break;
			case "ascii":
			case "binary":
			case "raw":
				ret = str.length;
				break;
			case "base64":
				ret = base64ToBytes(str).length;
				break;
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le":
				ret = str.length * 2;
				break;
			default: throw new Error("Unknown encoding");
		}
		return ret;
	}
	static concat(list, totalLength) {
		assert(isArray(list), "Usage: Buffer.concat(list, [totalLength])\nlist should be an Array.");
		if (list.length === 0) return new Buffer(0);
		else if (list.length === 1) return list[0];
		let i;
		if (typeof totalLength !== "number") {
			totalLength = 0;
			for (i = 0; i < list.length; i++) totalLength += list[i].length;
		}
		const buf = new Buffer(totalLength);
		let pos = 0;
		for (i = 0; i < list.length; i++) {
			const item = list[i];
			item.copy(buf, pos);
			pos += item.length;
		}
		return buf;
	}
	write(string, offset, length, encoding) {
		if (isFinite(offset)) {
			if (!isFinite(length)) {
				encoding = length;
				length = void 0;
			}
		} else {
			const swap = encoding;
			encoding = offset;
			offset = length;
			length = swap;
		}
		let off = Number(offset) || 0;
		const remaining = this.length - off;
		let len;
		if (!length) len = remaining;
		else {
			len = Number(length);
			if (len > remaining) len = remaining;
		}
		const enc = String(encoding || "utf8").toLowerCase();
		let ret;
		switch (enc) {
			case "hex":
				ret = _hexWrite(this, string, off, len);
				break;
			case "utf8":
			case "utf-8":
				ret = _utf8Write(this, string, off, len);
				break;
			case "ascii":
				ret = _asciiWrite(this, string, off, len);
				break;
			case "binary":
				ret = _binaryWrite(this, string, off, len);
				break;
			case "base64":
				ret = _base64Write(this, string, off, len);
				break;
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le":
				ret = _utf16leWrite(this, string, off, len);
				break;
			default: throw new Error("Unknown encoding");
		}
		return ret;
	}
	toString(encoding, start, end) {
		const enc = String(encoding || "utf8").toLowerCase();
		let s = Number(start) || 0;
		let e = end !== void 0 ? Number(end) : this.length;
		if (e === s) return "";
		let ret;
		switch (enc) {
			case "hex":
				ret = _hexSlice(this, s, e);
				break;
			case "utf8":
			case "utf-8":
				ret = _utf8Slice(this, s, e);
				break;
			case "ascii":
				ret = _asciiSlice(this, s, e);
				break;
			case "binary":
				ret = _binarySlice(this, s, e);
				break;
			case "base64":
				ret = _base64Slice(this, s, e);
				break;
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le":
				ret = _utf16leSlice(this, s, e);
				break;
			default: throw new Error("Unknown encoding");
		}
		return ret;
	}
	toJSON() {
		return {
			type: "Buffer",
			data: Array.prototype.slice.call(this._arr || this, 0)
		};
	}
	copy(target, target_start, start, end) {
		if (!start) start = 0;
		if (!end && end !== 0) end = this.length;
		if (!target_start) target_start = 0;
		if (end === start) return;
		if (target.length === 0 || this.length === 0) return;
		assert(end >= start, "sourceEnd < sourceStart");
		assert(target_start >= 0 && target_start < target.length, "targetStart out of bounds");
		assert(start >= 0 && start < this.length, "sourceStart out of bounds");
		assert(end >= 0 && end <= this.length, "sourceEnd out of bounds");
		let e = end;
		if (e > this.length) e = this.length;
		if (target.length - target_start < e - start) e = target.length - target_start + start;
		const len = e - start;
		if (len < 100) for (let i = 0; i < len; i++) target[i + target_start] = this[i + start];
		else Uint8Array.prototype.set.call(target, this.subarray(start, start + len), target_start);
	}
	slice(start, end) {
		const len = this.length;
		const s = clamp(start, len, 0);
		const e = clamp(end, len, len);
		return this.subarray(s, e);
	}
	/** @deprecated Use array indexes instead. */
	get(offset) {
		console.log(".get() is deprecated. Access using array indexes instead.");
		return this.readUInt8(offset);
	}
	set(v, offset) {
		if (typeof v === "number") {
			console.log(".set() is deprecated. Access using array indexes instead.");
			this.writeUInt8(v, offset);
		} else Uint8Array.prototype.set.call(this, v, offset);
	}
	readUInt8(offset, noAssert) {
		if (!noAssert) {
			assert(offset !== void 0 && offset !== null, "missing offset");
			assert(offset < this.length, "Trying to read beyond buffer length");
		}
		if (offset >= this.length) return;
		return this[offset];
	}
	readUInt16LE(offset, noAssert) {
		return _readUInt16(this, offset, true, noAssert);
	}
	readUInt16BE(offset, noAssert) {
		return _readUInt16(this, offset, false, noAssert);
	}
	readUInt32LE(offset, noAssert) {
		return _readUInt32(this, offset, true, noAssert);
	}
	readUInt32BE(offset, noAssert) {
		return _readUInt32(this, offset, false, noAssert);
	}
	readInt8(offset, noAssert) {
		if (!noAssert) {
			assert(offset !== void 0 && offset !== null, "missing offset");
			assert(offset < this.length, "Trying to read beyond buffer length");
		}
		if (offset >= this.length) return;
		if (this[offset] & 128) return (255 - this[offset] + 1) * -1;
		else return this[offset];
	}
	readInt16LE(offset, noAssert) {
		return _readInt16(this, offset, true, noAssert);
	}
	readInt16BE(offset, noAssert) {
		return _readInt16(this, offset, false, noAssert);
	}
	readInt32LE(offset, noAssert) {
		return _readInt32(this, offset, true, noAssert);
	}
	readInt32BE(offset, noAssert) {
		return _readInt32(this, offset, false, noAssert);
	}
	readFloatLE(offset, noAssert) {
		return _readFloat(this, offset, true, noAssert);
	}
	readFloatBE(offset, noAssert) {
		return _readFloat(this, offset, false, noAssert);
	}
	readDoubleLE(offset, noAssert) {
		return _readDouble(this, offset, true, noAssert);
	}
	readDoubleBE(offset, noAssert) {
		return _readDouble(this, offset, false, noAssert);
	}
	writeUInt8(value, offset, noAssert) {
		if (!noAssert) {
			assert(value !== void 0 && value !== null, "missing value");
			assert(offset !== void 0 && offset !== null, "missing offset");
			assert(offset < this.length, "trying to write beyond buffer length");
			verifuint(value, 255);
		}
		if (offset >= this.length) return;
		this[offset] = value;
	}
	writeUInt16LE(value, offset, noAssert) {
		_writeUInt16(this, value, offset, true, noAssert);
	}
	writeUInt16BE(value, offset, noAssert) {
		_writeUInt16(this, value, offset, false, noAssert);
	}
	writeUInt32LE(value, offset, noAssert) {
		_writeUInt32(this, value, offset, true, noAssert);
	}
	writeUInt32BE(value, offset, noAssert) {
		_writeUInt32(this, value, offset, false, noAssert);
	}
	writeInt8(value, offset, noAssert) {
		if (!noAssert) {
			assert(value !== void 0 && value !== null, "missing value");
			assert(offset !== void 0 && offset !== null, "missing offset");
			assert(offset < this.length, "Trying to write beyond buffer length");
			verifsint(value, 127, -128);
		}
		if (offset >= this.length) return;
		if (value >= 0) this.writeUInt8(value, offset, noAssert);
		else this.writeUInt8(255 + value + 1, offset, noAssert);
	}
	writeInt16LE(value, offset, noAssert) {
		_writeInt16(this, value, offset, true, noAssert);
	}
	writeInt16BE(value, offset, noAssert) {
		_writeInt16(this, value, offset, false, noAssert);
	}
	writeInt32LE(value, offset, noAssert) {
		_writeInt32(this, value, offset, true, noAssert);
	}
	writeInt32BE(value, offset, noAssert) {
		_writeInt32(this, value, offset, false, noAssert);
	}
	writeFloatLE(value, offset, noAssert) {
		_writeFloat(this, value, offset, true, noAssert);
	}
	writeFloatBE(value, offset, noAssert) {
		_writeFloat(this, value, offset, false, noAssert);
	}
	writeDoubleLE(value, offset, noAssert) {
		_writeDouble(this, value, offset, true, noAssert);
	}
	writeDoubleBE(value, offset, noAssert) {
		_writeDouble(this, value, offset, false, noAssert);
	}
	fill(value, start, end) {
		let v = value;
		if (!v) v = 0;
		let s = start;
		if (!s) s = 0;
		let e = end;
		if (!e) e = this.length;
		if (typeof v === "string") v = v.charCodeAt(0);
		assert(typeof v === "number" && !isNaN(v), "value is not a number");
		assert(e >= s, "end < start");
		if (e === s) return this;
		if (this.length === 0) return this;
		assert(s >= 0 && s < this.length, "start out of bounds");
		assert(e >= 0 && e <= this.length, "end out of bounds");
		for (let i = s; i < e; i++) this[i] = v;
		return this;
	}
	inspect() {
		const out = [];
		const len = this.length;
		for (let i = 0; i < len; i++) {
			out[i] = toHex(this[i]);
			if (i === 50) {
				out[i + 1] = "...";
				break;
			}
		}
		return "<Buffer " + out.join(" ") + ">";
	}
	toArrayBuffer() {
		return new Buffer(this).buffer;
	}
};
//#endregion
export { Buffer, Buffer as SlowBuffer, INSPECT_MAX_BYTES };

//# sourceMappingURL=index.js.map