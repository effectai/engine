/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, MaxLengthError, message } from 'protons-runtime'
import { alloc as uint8ArrayAlloc } from 'uint8arrays/alloc'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface ManagerMessage {
  task?: TaskMessage
  payment?: PaymentMessage
}

export namespace ManagerMessage {
  let _codec: Codec<ManagerMessage>

  export const codec = (): Codec<ManagerMessage> => {
    if (_codec == null) {
      _codec = message<ManagerMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.task != null) {
          w.uint32(10)
          TaskMessage.codec().encode(obj.task, w)
        }

        if (obj.payment != null) {
          w.uint32(18)
          PaymentMessage.codec().encode(obj.payment, w)
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
              obj.task = TaskMessage.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.task
              })
              break
            }
            case 2: {
              obj.payment = PaymentMessage.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.payment
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

  export const encode = (obj: Partial<ManagerMessage>): Uint8Array => {
    return encodeMessage(obj, ManagerMessage.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<ManagerMessage>): ManagerMessage => {
    return decodeMessage(buf, ManagerMessage.codec(), opts)
  }
}

export interface Payment {
  amount: number
  recipient: string
  paymentAccount: string
  nonce: bigint
  signature?: PaymentSignature
}

export namespace Payment {
  let _codec: Codec<Payment>

  export const codec = (): Codec<Payment> => {
    if (_codec == null) {
      _codec = message<Payment>((obj, w, opts = {}) => {
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

        if (obj.signature != null) {
          w.uint32(42)
          PaymentSignature.codec().encode(obj.signature, w)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          amount: 0,
          recipient: '',
          paymentAccount: '',
          nonce: 0n
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
              obj.signature = PaymentSignature.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.signature
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

  export const encode = (obj: Partial<Payment>): Uint8Array => {
    return encodeMessage(obj, Payment.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Payment>): Payment => {
    return decodeMessage(buf, Payment.codec(), opts)
  }
}

export interface PaymentSignature {
  R8?: PaymentSignature.R8Pair
  S: string
}

export namespace PaymentSignature {
  export interface R8Pair {
    R8_1: Uint8Array
    R8_2: Uint8Array
  }

  export namespace R8Pair {
    let _codec: Codec<R8Pair>

    export const codec = (): Codec<R8Pair> => {
      if (_codec == null) {
        _codec = message<R8Pair>((obj, w, opts = {}) => {
          if (opts.lengthDelimited !== false) {
            w.fork()
          }

          if ((obj.R8_1 != null && obj.R8_1.byteLength > 0)) {
            w.uint32(10)
            w.bytes(obj.R8_1)
          }

          if ((obj.R8_2 != null && obj.R8_2.byteLength > 0)) {
            w.uint32(18)
            w.bytes(obj.R8_2)
          }

          if (opts.lengthDelimited !== false) {
            w.ldelim()
          }
        }, (reader, length, opts = {}) => {
          const obj: any = {
            R8_1: uint8ArrayAlloc(0),
            R8_2: uint8ArrayAlloc(0)
          }

          const end = length == null ? reader.len : reader.pos + length

          while (reader.pos < end) {
            const tag = reader.uint32()

            switch (tag >>> 3) {
              case 1: {
                obj.R8_1 = reader.bytes()
                break
              }
              case 2: {
                obj.R8_2 = reader.bytes()
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

    export const encode = (obj: Partial<R8Pair>): Uint8Array => {
      return encodeMessage(obj, R8Pair.codec())
    }

    export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<R8Pair>): R8Pair => {
      return decodeMessage(buf, R8Pair.codec(), opts)
    }
  }

  let _codec: Codec<PaymentSignature>

  export const codec = (): Codec<PaymentSignature> => {
    if (_codec == null) {
      _codec = message<PaymentSignature>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.R8 != null) {
          w.uint32(10)
          PaymentSignature.R8Pair.codec().encode(obj.R8, w)
        }

        if ((obj.S != null && obj.S !== '')) {
          w.uint32(18)
          w.string(obj.S)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          S: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.R8 = PaymentSignature.R8Pair.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.R8
              })
              break
            }
            case 2: {
              obj.S = reader.string()
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

  export const encode = (obj: Partial<PaymentSignature>): Uint8Array => {
    return encodeMessage(obj, PaymentSignature.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<PaymentSignature>): PaymentSignature => {
    return decodeMessage(buf, PaymentSignature.codec(), opts)
  }
}

export interface ProofRequest {
  batchSize: number
  payments: ProofRequest.PaymentProof[]
}

export namespace ProofRequest {
  export interface PaymentProof {
    signature?: PaymentSignature
    amount: number
    nonce: bigint
    recipient: string
  }

  export namespace PaymentProof {
    let _codec: Codec<PaymentProof>

    export const codec = (): Codec<PaymentProof> => {
      if (_codec == null) {
        _codec = message<PaymentProof>((obj, w, opts = {}) => {
          if (opts.lengthDelimited !== false) {
            w.fork()
          }

          if (obj.signature != null) {
            w.uint32(10)
            PaymentSignature.codec().encode(obj.signature, w)
          }

          if ((obj.amount != null && obj.amount !== 0)) {
            w.uint32(21)
            w.float(obj.amount)
          }

          if ((obj.nonce != null && obj.nonce !== 0n)) {
            w.uint32(24)
            w.uint64(obj.nonce)
          }

          if ((obj.recipient != null && obj.recipient !== '')) {
            w.uint32(34)
            w.string(obj.recipient)
          }

          if (opts.lengthDelimited !== false) {
            w.ldelim()
          }
        }, (reader, length, opts = {}) => {
          const obj: any = {
            amount: 0,
            nonce: 0n,
            recipient: ''
          }

          const end = length == null ? reader.len : reader.pos + length

          while (reader.pos < end) {
            const tag = reader.uint32()

            switch (tag >>> 3) {
              case 1: {
                obj.signature = PaymentSignature.codec().decode(reader, reader.uint32(), {
                  limits: opts.limits?.signature
                })
                break
              }
              case 2: {
                obj.amount = reader.float()
                break
              }
              case 3: {
                obj.nonce = reader.uint64()
                break
              }
              case 4: {
                obj.recipient = reader.string()
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

    export const encode = (obj: Partial<PaymentProof>): Uint8Array => {
      return encodeMessage(obj, PaymentProof.codec())
    }

    export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<PaymentProof>): PaymentProof => {
      return decodeMessage(buf, PaymentProof.codec(), opts)
    }
  }

  let _codec: Codec<ProofRequest>

  export const codec = (): Codec<ProofRequest> => {
    if (_codec == null) {
      _codec = message<ProofRequest>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.batchSize != null && obj.batchSize !== 0)) {
          w.uint32(8)
          w.uint32(obj.batchSize)
        }

        if (obj.payments != null) {
          for (const value of obj.payments) {
            w.uint32(18)
            ProofRequest.PaymentProof.codec().encode(value, w)
          }
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          batchSize: 0,
          payments: []
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.batchSize = reader.uint32()
              break
            }
            case 2: {
              if (opts.limits?.payments != null && obj.payments.length === opts.limits.payments) {
                throw new MaxLengthError('Decode error - map field "payments" had too many elements')
              }

              obj.payments.push(ProofRequest.PaymentProof.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.payments$
              }))
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

  export const encode = (obj: Partial<ProofRequest>): Uint8Array => {
    return encodeMessage(obj, ProofRequest.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<ProofRequest>): ProofRequest => {
    return decodeMessage(buf, ProofRequest.codec(), opts)
  }
}

export interface ProofResponse {
  piA: string[]
  piB: ProofResponse.Matrix[]
  piC: string[]
  protocol: string
  curve: string
}

export namespace ProofResponse {
  export interface Matrix {
    row: string[]
  }

  export namespace Matrix {
    let _codec: Codec<Matrix>

    export const codec = (): Codec<Matrix> => {
      if (_codec == null) {
        _codec = message<Matrix>((obj, w, opts = {}) => {
          if (opts.lengthDelimited !== false) {
            w.fork()
          }

          if (obj.row != null) {
            for (const value of obj.row) {
              w.uint32(10)
              w.string(value)
            }
          }

          if (opts.lengthDelimited !== false) {
            w.ldelim()
          }
        }, (reader, length, opts = {}) => {
          const obj: any = {
            row: []
          }

          const end = length == null ? reader.len : reader.pos + length

          while (reader.pos < end) {
            const tag = reader.uint32()

            switch (tag >>> 3) {
              case 1: {
                if (opts.limits?.row != null && obj.row.length === opts.limits.row) {
                  throw new MaxLengthError('Decode error - map field "row" had too many elements')
                }

                obj.row.push(reader.string())
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

    export const encode = (obj: Partial<Matrix>): Uint8Array => {
      return encodeMessage(obj, Matrix.codec())
    }

    export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Matrix>): Matrix => {
      return decodeMessage(buf, Matrix.codec(), opts)
    }
  }

  let _codec: Codec<ProofResponse>

  export const codec = (): Codec<ProofResponse> => {
    if (_codec == null) {
      _codec = message<ProofResponse>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.piA != null) {
          for (const value of obj.piA) {
            w.uint32(10)
            w.string(value)
          }
        }

        if (obj.piB != null) {
          for (const value of obj.piB) {
            w.uint32(18)
            ProofResponse.Matrix.codec().encode(value, w)
          }
        }

        if (obj.piC != null) {
          for (const value of obj.piC) {
            w.uint32(26)
            w.string(value)
          }
        }

        if ((obj.protocol != null && obj.protocol !== '')) {
          w.uint32(34)
          w.string(obj.protocol)
        }

        if ((obj.curve != null && obj.curve !== '')) {
          w.uint32(42)
          w.string(obj.curve)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          piA: [],
          piB: [],
          piC: [],
          protocol: '',
          curve: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              if (opts.limits?.piA != null && obj.piA.length === opts.limits.piA) {
                throw new MaxLengthError('Decode error - map field "piA" had too many elements')
              }

              obj.piA.push(reader.string())
              break
            }
            case 2: {
              if (opts.limits?.piB != null && obj.piB.length === opts.limits.piB) {
                throw new MaxLengthError('Decode error - map field "piB" had too many elements')
              }

              obj.piB.push(ProofResponse.Matrix.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.piB$
              }))
              break
            }
            case 3: {
              if (opts.limits?.piC != null && obj.piC.length === opts.limits.piC) {
                throw new MaxLengthError('Decode error - map field "piC" had too many elements')
              }

              obj.piC.push(reader.string())
              break
            }
            case 4: {
              obj.protocol = reader.string()
              break
            }
            case 5: {
              obj.curve = reader.string()
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

  export const encode = (obj: Partial<ProofResponse>): Uint8Array => {
    return encodeMessage(obj, ProofResponse.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<ProofResponse>): ProofResponse => {
    return decodeMessage(buf, ProofResponse.codec(), opts)
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
  nonce: bigint
}

export namespace NonceResponse {
  let _codec: Codec<NonceResponse>

  export const codec = (): Codec<NonceResponse> => {
    if (_codec == null) {
      _codec = message<NonceResponse>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.nonce != null && obj.nonce !== 0n)) {
          w.uint32(8)
          w.uint64(obj.nonce)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          nonce: 0n
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.nonce = reader.uint64()
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

export interface PayoutRequest {
  peerId: string
}

export namespace PayoutRequest {
  let _codec: Codec<PayoutRequest>

  export const codec = (): Codec<PayoutRequest> => {
    if (_codec == null) {
      _codec = message<PayoutRequest>((obj, w, opts = {}) => {
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

  export const encode = (obj: Partial<PayoutRequest>): Uint8Array => {
    return encodeMessage(obj, PayoutRequest.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<PayoutRequest>): PayoutRequest => {
    return decodeMessage(buf, PayoutRequest.codec(), opts)
  }
}

export interface PaymentMessage {
  payment?: Payment
  requestNonce?: RequestNonce
  nonceResponse?: NonceResponse
  paymentAck?: PaymentAcknowledgment
  proofRequest?: ProofRequest
  proofResponse?: ProofResponse
  payoutRequest?: PayoutRequest
}

export namespace PaymentMessage {
  let _codec: Codec<PaymentMessage>

  export const codec = (): Codec<PaymentMessage> => {
    if (_codec == null) {
      _codec = message<PaymentMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.payment != null) {
          w.uint32(10)
          Payment.codec().encode(obj.payment, w)
        }

        if (obj.requestNonce != null) {
          w.uint32(18)
          RequestNonce.codec().encode(obj.requestNonce, w)
        }

        if (obj.nonceResponse != null) {
          w.uint32(26)
          NonceResponse.codec().encode(obj.nonceResponse, w)
        }

        if (obj.paymentAck != null) {
          w.uint32(34)
          PaymentAcknowledgment.codec().encode(obj.paymentAck, w)
        }

        if (obj.proofRequest != null) {
          w.uint32(42)
          ProofRequest.codec().encode(obj.proofRequest, w)
        }

        if (obj.proofResponse != null) {
          w.uint32(50)
          ProofResponse.codec().encode(obj.proofResponse, w)
        }

        if (obj.payoutRequest != null) {
          w.uint32(58)
          PayoutRequest.codec().encode(obj.payoutRequest, w)
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
              obj.payment = Payment.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.payment
              })
              break
            }
            case 2: {
              obj.requestNonce = RequestNonce.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.requestNonce
              })
              break
            }
            case 3: {
              obj.nonceResponse = NonceResponse.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.nonceResponse
              })
              break
            }
            case 4: {
              obj.paymentAck = PaymentAcknowledgment.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.paymentAck
              })
              break
            }
            case 5: {
              obj.proofRequest = ProofRequest.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.proofRequest
              })
              break
            }
            case 6: {
              obj.proofResponse = ProofResponse.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.proofResponse
              })
              break
            }
            case 7: {
              obj.payoutRequest = PayoutRequest.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.payoutRequest
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

export enum TaskStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

enum __TaskStatusValues {
  CREATED = 0,
  ASSIGNED = 1,
  ACCEPTED = 2,
  REJECTED = 3,
  COMPLETED = 4
}

export namespace TaskStatus {
  export const codec = (): Codec<TaskStatus> => {
    return enumeration<TaskStatus>(__TaskStatusValues)
  }
}
export interface Task {
  taskId: string
  manager: string
  created: string
  reward: string
  template: string
  result: string
  signature: string
  status: TaskStatus
}

export namespace Task {
  let _codec: Codec<Task>

  export const codec = (): Codec<Task> => {
    if (_codec == null) {
      _codec = message<Task>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.taskId != null && obj.taskId !== '')) {
          w.uint32(10)
          w.string(obj.taskId)
        }

        if ((obj.manager != null && obj.manager !== '')) {
          w.uint32(18)
          w.string(obj.manager)
        }

        if ((obj.created != null && obj.created !== '')) {
          w.uint32(26)
          w.string(obj.created)
        }

        if ((obj.reward != null && obj.reward !== '')) {
          w.uint32(34)
          w.string(obj.reward)
        }

        if ((obj.template != null && obj.template !== '')) {
          w.uint32(42)
          w.string(obj.template)
        }

        if ((obj.result != null && obj.result !== '')) {
          w.uint32(50)
          w.string(obj.result)
        }

        if ((obj.signature != null && obj.signature !== '')) {
          w.uint32(58)
          w.string(obj.signature)
        }

        if (obj.status != null && __TaskStatusValues[obj.status] !== 0) {
          w.uint32(64)
          TaskStatus.codec().encode(obj.status, w)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          manager: '',
          created: '',
          reward: '',
          template: '',
          result: '',
          signature: '',
          status: TaskStatus.CREATED
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.taskId = reader.string()
              break
            }
            case 2: {
              obj.manager = reader.string()
              break
            }
            case 3: {
              obj.created = reader.string()
              break
            }
            case 4: {
              obj.reward = reader.string()
              break
            }
            case 5: {
              obj.template = reader.string()
              break
            }
            case 6: {
              obj.result = reader.string()
              break
            }
            case 7: {
              obj.signature = reader.string()
              break
            }
            case 8: {
              obj.status = TaskStatus.codec().decode(reader)
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

  export const encode = (obj: Partial<Task>): Uint8Array => {
    return encodeMessage(obj, Task.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Task>): Task => {
    return decodeMessage(buf, Task.codec(), opts)
  }
}

export interface TaskAccepted {
  taskId: string
  worker: string
  timestamp: string
}

export namespace TaskAccepted {
  let _codec: Codec<TaskAccepted>

  export const codec = (): Codec<TaskAccepted> => {
    if (_codec == null) {
      _codec = message<TaskAccepted>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.taskId != null && obj.taskId !== '')) {
          w.uint32(10)
          w.string(obj.taskId)
        }

        if ((obj.worker != null && obj.worker !== '')) {
          w.uint32(18)
          w.string(obj.worker)
        }

        if ((obj.timestamp != null && obj.timestamp !== '')) {
          w.uint32(26)
          w.string(obj.timestamp)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          worker: '',
          timestamp: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.taskId = reader.string()
              break
            }
            case 2: {
              obj.worker = reader.string()
              break
            }
            case 3: {
              obj.timestamp = reader.string()
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

  export const encode = (obj: Partial<TaskAccepted>): Uint8Array => {
    return encodeMessage(obj, TaskAccepted.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<TaskAccepted>): TaskAccepted => {
    return decodeMessage(buf, TaskAccepted.codec(), opts)
  }
}

export interface TaskRejected {
  taskId: string
  worker: string
  reason: string
  timestamp: string
}

export namespace TaskRejected {
  let _codec: Codec<TaskRejected>

  export const codec = (): Codec<TaskRejected> => {
    if (_codec == null) {
      _codec = message<TaskRejected>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.taskId != null && obj.taskId !== '')) {
          w.uint32(10)
          w.string(obj.taskId)
        }

        if ((obj.worker != null && obj.worker !== '')) {
          w.uint32(18)
          w.string(obj.worker)
        }

        if ((obj.reason != null && obj.reason !== '')) {
          w.uint32(26)
          w.string(obj.reason)
        }

        if ((obj.timestamp != null && obj.timestamp !== '')) {
          w.uint32(34)
          w.string(obj.timestamp)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          worker: '',
          reason: '',
          timestamp: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.taskId = reader.string()
              break
            }
            case 2: {
              obj.worker = reader.string()
              break
            }
            case 3: {
              obj.reason = reader.string()
              break
            }
            case 4: {
              obj.timestamp = reader.string()
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

  export const encode = (obj: Partial<TaskRejected>): Uint8Array => {
    return encodeMessage(obj, TaskRejected.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<TaskRejected>): TaskRejected => {
    return decodeMessage(buf, TaskRejected.codec(), opts)
  }
}

export interface TaskCompleted {
  taskId: string
  worker: string
  result: string
  timestamp: string
}

export namespace TaskCompleted {
  let _codec: Codec<TaskCompleted>

  export const codec = (): Codec<TaskCompleted> => {
    if (_codec == null) {
      _codec = message<TaskCompleted>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.taskId != null && obj.taskId !== '')) {
          w.uint32(10)
          w.string(obj.taskId)
        }

        if ((obj.worker != null && obj.worker !== '')) {
          w.uint32(18)
          w.string(obj.worker)
        }

        if ((obj.result != null && obj.result !== '')) {
          w.uint32(26)
          w.string(obj.result)
        }

        if ((obj.timestamp != null && obj.timestamp !== '')) {
          w.uint32(34)
          w.string(obj.timestamp)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          worker: '',
          result: '',
          timestamp: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.taskId = reader.string()
              break
            }
            case 2: {
              obj.worker = reader.string()
              break
            }
            case 3: {
              obj.result = reader.string()
              break
            }
            case 4: {
              obj.timestamp = reader.string()
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

  export const encode = (obj: Partial<TaskCompleted>): Uint8Array => {
    return encodeMessage(obj, TaskCompleted.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<TaskCompleted>): TaskCompleted => {
    return decodeMessage(buf, TaskCompleted.codec(), opts)
  }
}

export interface TaskMessage {
  taskId: string
  task?: Task
  taskAccepted?: TaskAccepted
  taskRejected?: TaskRejected
  taskCompleted?: TaskCompleted
}

export namespace TaskMessage {
  let _codec: Codec<TaskMessage>

  export const codec = (): Codec<TaskMessage> => {
    if (_codec == null) {
      _codec = message<TaskMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.taskId != null && obj.taskId !== '')) {
          w.uint32(10)
          w.string(obj.taskId)
        }

        if (obj.task != null) {
          w.uint32(18)
          Task.codec().encode(obj.task, w)
        }

        if (obj.taskAccepted != null) {
          w.uint32(26)
          TaskAccepted.codec().encode(obj.taskAccepted, w)
        }

        if (obj.taskRejected != null) {
          w.uint32(34)
          TaskRejected.codec().encode(obj.taskRejected, w)
        }

        if (obj.taskCompleted != null) {
          w.uint32(42)
          TaskCompleted.codec().encode(obj.taskCompleted, w)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.taskId = reader.string()
              break
            }
            case 2: {
              obj.task = Task.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.task
              })
              break
            }
            case 3: {
              obj.taskAccepted = TaskAccepted.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.taskAccepted
              })
              break
            }
            case 4: {
              obj.taskRejected = TaskRejected.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.taskRejected
              })
              break
            }
            case 5: {
              obj.taskCompleted = TaskCompleted.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.taskCompleted
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

  export const encode = (obj: Partial<TaskMessage>): Uint8Array => {
    return encodeMessage(obj, TaskMessage.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<TaskMessage>): TaskMessage => {
    return decodeMessage(buf, TaskMessage.codec(), opts)
  }
}
