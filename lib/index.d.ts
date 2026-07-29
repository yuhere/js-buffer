/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
export declare const INSPECT_MAX_BYTES = 50;
export type BufferEncoding = 'hex' | 'utf8' | 'utf-8' | 'ascii' | 'binary' | 'base64' | 'raw' | 'ucs2' | 'ucs-2' | 'utf16le' | 'utf-16le';
type BufferSubject = number | string | ArrayLike<number> | ArrayBuffer | SharedArrayBuffer;
declare class Buffer extends Uint8Array {
    /** @internal set in constructor — checked by Buffer.isBuffer() */
    _isBuffer: boolean;
    /** @internal legacy compat — always undefined, kept for toJSON() */
    _arr: Uint8Array | undefined;
    static poolSize: number;
    constructor(size: number);
    constructor(array: ArrayLike<number>);
    constructor(buffer: ArrayBuffer | SharedArrayBuffer, byteOffset?: number, length?: number);
    constructor(str: string, encoding?: BufferEncoding);
    constructor(subject: BufferSubject, encoding?: number | string, noZero?: number);
    static isEncoding(encoding: string): boolean;
    static isBuffer(b: unknown): b is Buffer;
    static byteLength(str: string, encoding?: string): number;
    static concat(list: Uint8Array[], totalLength?: number): Buffer;
    write(string: string, offset?: number, length?: number, encoding?: BufferEncoding): number;
    write(string: string, encoding?: BufferEncoding, offset?: number, length?: number): number;
    toString(encoding?: BufferEncoding, start?: number, end?: number): string;
    toJSON(): {
        type: 'Buffer';
        data: number[];
    };
    copy(target: Uint8Array, target_start?: number, start?: number, end?: number): void;
    slice(start?: number, end?: number): Buffer;
    /** @deprecated Use array indexes instead. */
    get(offset: number): number | undefined;
    /** @deprecated Use array indexes instead. */
    set(v: number, offset?: number): void;
    /** Matches Uint8Array.prototype.set for type compatibility. */
    set(array: ArrayLike<number>, offset?: number): void;
    readUInt8(offset: number, noAssert?: boolean): number | undefined;
    readUInt16LE(offset: number, noAssert?: boolean): number | undefined;
    readUInt16BE(offset: number, noAssert?: boolean): number | undefined;
    readUInt32LE(offset: number, noAssert?: boolean): number | undefined;
    readUInt32BE(offset: number, noAssert?: boolean): number | undefined;
    readInt8(offset: number, noAssert?: boolean): number | undefined;
    readInt16LE(offset: number, noAssert?: boolean): number | undefined;
    readInt16BE(offset: number, noAssert?: boolean): number | undefined;
    readInt32LE(offset: number, noAssert?: boolean): number | undefined;
    readInt32BE(offset: number, noAssert?: boolean): number | undefined;
    readFloatLE(offset: number, noAssert?: boolean): number;
    readFloatBE(offset: number, noAssert?: boolean): number;
    readDoubleLE(offset: number, noAssert?: boolean): number;
    readDoubleBE(offset: number, noAssert?: boolean): number;
    writeUInt8(value: number, offset: number, noAssert?: boolean): void;
    writeUInt16LE(value: number, offset: number, noAssert?: boolean): void;
    writeUInt16BE(value: number, offset: number, noAssert?: boolean): void;
    writeUInt32LE(value: number, offset: number, noAssert?: boolean): void;
    writeUInt32BE(value: number, offset: number, noAssert?: boolean): void;
    writeInt8(value: number, offset: number, noAssert?: boolean): void;
    writeInt16LE(value: number, offset: number, noAssert?: boolean): void;
    writeInt16BE(value: number, offset: number, noAssert?: boolean): void;
    writeInt32LE(value: number, offset: number, noAssert?: boolean): void;
    writeInt32BE(value: number, offset: number, noAssert?: boolean): void;
    writeFloatLE(value: number, offset: number, noAssert?: boolean): void;
    writeFloatBE(value: number, offset: number, noAssert?: boolean): void;
    writeDoubleLE(value: number, offset: number, noAssert?: boolean): void;
    writeDoubleBE(value: number, offset: number, noAssert?: boolean): void;
    fill(value?: number | string, start?: number, end?: number): this;
    inspect(): string;
    toArrayBuffer(): ArrayBuffer;
}
export { Buffer, Buffer as SlowBuffer };
//# sourceMappingURL=index.d.ts.map