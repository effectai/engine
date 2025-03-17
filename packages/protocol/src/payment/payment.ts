/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface SignedPayment {
  amount: number
  recipient: string
  paymentAccount: string
  nonce: bigint
  signature: string
}

export namespace SignedPayment {
  let _codec: Codec<SignedPayment>

  export const codec = (): Codec<SignedPayment> => {
    if (_codec == null) {
      _codec = message<SignedPayment>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.amount != null && obj.amount !== 0)) {
          w.uint32(13)
          w.float(obj.amount)
        }

        if ((obj.recipient != null && obj.recipient !== '')) {
          w.uint32(18)
          w.string(obj.recipient)
        }

        if ((obj.paymentAccount != null && obj.paymentAccount !== '')) {
          w.uint32(26)
          w.string(obj.paymentAccount)
        }

        if ((obj.nonce != null && obj.nonce !== 0n)) {
          w.uint32(32)
          w.uint64(obj.nonce)
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
          amount: 0,
          recipient: '',
          paymentAccount: '',
          nonce: 0n,
          signature: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.amount = reader.float()
              break
            }
            case 2: {
              obj.recipient = reader.string()
              break
            }
            case 3: {
              obj.paymentAccount = reader.string()
              break
            }
            case 4: {
              obj.nonce = reader.uint64()
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

  export const encode = (obj: Partial<SignedPayment>): Uint8Array => {
    return encodeMessage(obj, SignedPayment.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<SignedPayment>): SignedPayment => {
    return decodeMessage(buf, SignedPayment.codec(), opts)
  }
}

export interface RequestNonce {
  peerId: string
}

export namespace RequestNonce {
  let _codec: Codec<RequestNonce>

  export const codec = (): Codec<RequestNonce> => {
    if (_codec == null) {
      _codec = message<RequestNonce>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.peerId != null && obj.peerId !== '')) {
          w.uint32(10)
          w.string(obj.peerId)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          peerId: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.peerId = reader.string()
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

  export const encode = (obj: Partial<RequestNonce>): Uint8Array => {
    return encodeMessage(obj, RequestNonce.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<RequestNonce>): RequestNonce => {
    return decodeMessage(buf, RequestNonce.codec(), opts)
  }
}

export interface NonceResponse {
  nonce: string
}

export namespace NonceResponse {
  let _codec: Codec<NonceResponse>

  export const codec = (): Codec<NonceResponse> => {
    if (_codec == null) {
      _codec = message<NonceResponse>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.nonce != null && obj.nonce !== '')) {
          w.uint32(10)
          w.string(obj.nonce)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          nonce: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.nonce = reader.string()
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

  export const encode = (obj: Partial<NonceResponse>): Uint8Array => {
    return encodeMessage(obj, NonceResponse.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<NonceResponse>): NonceResponse => {
    return decodeMessage(buf, NonceResponse.codec(), opts)
  }
}

export interface PaymentAcknowledgment {
  nonce: bigint
  success: boolean
}

export namespace PaymentAcknowledgment {
  let _codec: Codec<PaymentAcknowledgment>

  export const codec = (): Codec<PaymentAcknowledgment> => {
    if (_codec == null) {
      _codec = message<PaymentAcknowledgment>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.nonce != null && obj.nonce !== 0n)) {
          w.uint32(8)
          w.uint64(obj.nonce)
        }

        if ((obj.success != null && obj.success !== false)) {
          w.uint32(16)
          w.bool(obj.success)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          nonce: 0n,
          success: false
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.nonce = reader.uint64()
              break
            }
            case 2: {
              obj.success = reader.bool()
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

  export const encode = (obj: Partial<PaymentAcknowledgment>): Uint8Array => {
    return encodeMessage(obj, PaymentAcknowledgment.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<PaymentAcknowledgment>): PaymentAcknowledgment => {
    return decodeMessage(buf, PaymentAcknowledgment.codec(), opts)
  }
}

export interface PaymentMessage {
  requestNonce?: RequestNonce
  nonceResponse?: NonceResponse
  signedPayment?: SignedPayment
  paymentAck?: PaymentAcknowledgment
}

export namespace PaymentMessage {
  let _codec: Codec<PaymentMessage>

  export const codec = (): Codec<PaymentMessage> => {
    if (_codec == null) {
      _codec = message<PaymentMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.requestNonce != null) {
          w.uint32(10)
          RequestNonce.codec().encode(obj.requestNonce, w)
        }

        if (obj.nonceResponse != null) {
          w.uint32(18)
          NonceResponse.codec().encode(obj.nonceResponse, w)
        }

        if (obj.signedPayment != null) {
          w.uint32(26)
          SignedPayment.codec().encode(obj.signedPayment, w)
        }

        if (obj.paymentAck != null) {
          w.uint32(34)
          PaymentAcknowledgment.codec().encode(obj.paymentAck, w)
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
              obj.requestNonce = RequestNonce.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.requestNonce
              })
              break
            }
            case 2: {
              obj.nonceResponse = NonceResponse.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.nonceResponse
              })
              break
            }
            case 3: {
              obj.signedPayment = SignedPayment.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.signedPayment
              })
              break
            }
            case 4: {
              obj.paymentAck = PaymentAcknowledgment.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.paymentAck
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

  export const encode = (obj: Partial<PaymentMessage>): Uint8Array => {
    return encodeMessage(obj, PaymentMessage.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<PaymentMessage>): PaymentMessage => {
    return decodeMessage(buf, PaymentMessage.codec(), opts)
  }
}
