/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface Payment {
  id: string
  amount: string
  escrowAccount: string
  recipient: string
  signature: string
}

export namespace Payment {
  let _codec: Codec<Payment>

  export const codec = (): Codec<Payment> => {
    if (_codec == null) {
      _codec = message<Payment>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.id != null && obj.id !== '')) {
          w.uint32(10)
          w.string(obj.id)
        }

        if ((obj.amount != null && obj.amount !== '')) {
          w.uint32(18)
          w.string(obj.amount)
        }

        if ((obj.escrowAccount != null && obj.escrowAccount !== '')) {
          w.uint32(26)
          w.string(obj.escrowAccount)
        }

        if ((obj.recipient != null && obj.recipient !== '')) {
          w.uint32(34)
          w.string(obj.recipient)
        }

        if ((obj.signature != null && obj.signature !== '')) {
          w.uint32(42)
          w.string(obj.signature)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          id: '',
          amount: '',
          escrowAccount: '',
          recipient: '',
          signature: ''
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
              obj.amount = reader.string()
              break
            }
            case 3: {
              obj.escrowAccount = reader.string()
              break
            }
            case 4: {
              obj.recipient = reader.string()
              break
            }
            case 5: {
              obj.signature = reader.string()
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

  export const encode = (obj: Partial<Payment>): Uint8Array => {
    return encodeMessage(obj, Payment.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Payment>): Payment => {
    return decodeMessage(buf, Payment.codec(), opts)
  }
}
