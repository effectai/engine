/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, message } from 'protons-runtime'
import { alloc as uint8ArrayAlloc } from 'uint8arrays/alloc'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface WorkerSessionData {
  id: string
  nonce: bigint
  delegate: Uint8Array
}

export namespace WorkerSessionData {
  let _codec: Codec<WorkerSessionData>

  export const codec = (): Codec<WorkerSessionData> => {
    if (_codec == null) {
      _codec = message<WorkerSessionData>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.id != null && obj.id !== '')) {
          w.uint32(10)
          w.string(obj.id)
        }

        if ((obj.nonce != null && obj.nonce !== 0n)) {
          w.uint32(16)
          w.uint64(obj.nonce)
        }

        if ((obj.delegate != null && obj.delegate.byteLength > 0)) {
          w.uint32(26)
          w.bytes(obj.delegate)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          id: '',
          nonce: 0n,
          delegate: uint8ArrayAlloc(0)
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.id = reader.string()
              break
            }
            case 2: {
              obj.nonce = reader.uint64()
              break
            }
            case 3: {
              obj.delegate = reader.bytes()
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<WorkerSessionData>): Uint8Array => {
    return encodeMessage(obj, WorkerSessionData.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<WorkerSessionData>): WorkerSessionData => {
    return decodeMessage(buf, WorkerSessionData.codec(), opts)
  }
}

export interface ManagerSessionData {
  pubX: Uint8Array
  pubY: Uint8Array
}

export namespace ManagerSessionData {
  let _codec: Codec<ManagerSessionData>

  export const codec = (): Codec<ManagerSessionData> => {
    if (_codec == null) {
      _codec = message<ManagerSessionData>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.pubX != null && obj.pubX.byteLength > 0)) {
          w.uint32(10)
          w.bytes(obj.pubX)
        }

        if ((obj.pubY != null && obj.pubY.byteLength > 0)) {
          w.uint32(18)
          w.bytes(obj.pubY)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          pubX: uint8ArrayAlloc(0),
          pubY: uint8ArrayAlloc(0)
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.pubX = reader.bytes()
              break
            }
            case 2: {
              obj.pubY = reader.bytes()
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<ManagerSessionData>): Uint8Array => {
    return encodeMessage(obj, ManagerSessionData.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<ManagerSessionData>): ManagerSessionData => {
    return decodeMessage(buf, ManagerSessionData.codec(), opts)
  }
}

export interface SessionMessage {
  worker?: WorkerSessionData
  manager?: ManagerSessionData
}

export namespace SessionMessage {
  let _codec: Codec<SessionMessage>

  export const codec = (): Codec<SessionMessage> => {
    if (_codec == null) {
      _codec = message<SessionMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.worker != null) {
          w.uint32(10)
          WorkerSessionData.codec().encode(obj.worker, w)
        }

        if (obj.manager != null) {
          w.uint32(18)
          ManagerSessionData.codec().encode(obj.manager, w)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {}

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.worker = WorkerSessionData.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.worker
              })
              break
            }
            case 2: {
              obj.manager = ManagerSessionData.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.manager
              })
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<SessionMessage>): Uint8Array => {
    return encodeMessage(obj, SessionMessage.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<SessionMessage>): SessionMessage => {
    return decodeMessage(buf, SessionMessage.codec(), opts)
  }
}
