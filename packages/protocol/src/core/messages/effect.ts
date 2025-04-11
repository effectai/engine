/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, MaxLengthError, message } from 'protons-runtime'
import { alloc as uint8ArrayAlloc } from 'uint8arrays/alloc'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface EffectError {
  timestamp: number
  message: string
  code: string
}

export namespace EffectError {
  let _codec: Codec<EffectError>

  export const codec = (): Codec<EffectError> => {
    if (_codec == null) {
      _codec = message<EffectError>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.timestamp != null && obj.timestamp !== 0)) {
          w.uint32(8)
          w.uint32(obj.timestamp)
        }

        if ((obj.message != null && obj.message !== '')) {
          w.uint32(18)
          w.string(obj.message)
        }

        if ((obj.code != null && obj.code !== '')) {
          w.uint32(26)
          w.string(obj.code)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          timestamp: 0,
          message: '',
          code: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.timestamp = reader.uint32()
              break
            }
            case 2: {
              obj.message = reader.string()
              break
            }
            case 3: {
              obj.code = reader.string()
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

  export const encode = (obj: Partial<EffectError>): Uint8Array => {
    return encodeMessage(obj, EffectError.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<EffectError>): EffectError => {
    return decodeMessage(buf, EffectError.codec(), opts)
  }
}

export interface EffectAcknowledgment {
  timestamp: number
}

export namespace EffectAcknowledgment {
  let _codec: Codec<EffectAcknowledgment>

  export const codec = (): Codec<EffectAcknowledgment> => {
    if (_codec == null) {
      _codec = message<EffectAcknowledgment>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.timestamp != null && obj.timestamp !== 0)) {
          w.uint32(8)
          w.uint32(obj.timestamp)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          timestamp: 0
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.timestamp = reader.uint32()
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

  export const encode = (obj: Partial<EffectAcknowledgment>): Uint8Array => {
    return encodeMessage(obj, EffectAcknowledgment.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<EffectAcknowledgment>): EffectAcknowledgment => {
    return decodeMessage(buf, EffectAcknowledgment.codec(), opts)
  }
}

export interface RequestToWork {
  timestamp: number
  recipient: string
  nonce: bigint
}

export namespace RequestToWork {
  let _codec: Codec<RequestToWork>

  export const codec = (): Codec<RequestToWork> => {
    if (_codec == null) {
      _codec = message<RequestToWork>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.timestamp != null && obj.timestamp !== 0)) {
          w.uint32(8)
          w.uint32(obj.timestamp)
        }

        if ((obj.recipient != null && obj.recipient !== '')) {
          w.uint32(18)
          w.string(obj.recipient)
        }

        if ((obj.nonce != null && obj.nonce !== 0n)) {
          w.uint32(24)
          w.uint64(obj.nonce)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          timestamp: 0,
          recipient: '',
          nonce: 0n
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.timestamp = reader.uint32()
              break
            }
            case 2: {
              obj.recipient = reader.string()
              break
            }
            case 3: {
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

  export const encode = (obj: Partial<RequestToWork>): Uint8Array => {
    return encodeMessage(obj, RequestToWork.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<RequestToWork>): RequestToWork => {
    return decodeMessage(buf, RequestToWork.codec(), opts)
  }
}

export interface RequestToWorkResponse {
  pubX: Uint8Array
  pubY: Uint8Array
}

export namespace RequestToWorkResponse {
  let _codec: Codec<RequestToWorkResponse>

  export const codec = (): Codec<RequestToWorkResponse> => {
    if (_codec == null) {
      _codec = message<RequestToWorkResponse>((obj, w, opts = {}) => {
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

  export const encode = (obj: Partial<RequestToWorkResponse>): Uint8Array => {
    return encodeMessage(obj, RequestToWorkResponse.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<RequestToWorkResponse>): RequestToWorkResponse => {
    return decodeMessage(buf, RequestToWorkResponse.codec(), opts)
  }
}

export interface EffectProtocolMessage {
  task?: Task
  taskAccepted?: TaskAccepted
  taskRejected?: TaskRejected
  taskCompleted?: TaskCompleted
  payment?: Payment
  payoutRequest?: PayoutRequest
  proofRequest?: ProofRequest
  proofResponse?: ProofResponse
  templateRequest?: TemplateRequest
  templateResponse?: Template
  error?: EffectError
  ack?: EffectAcknowledgment
  requestToWork?: RequestToWork
  requestToWorkResponse?: RequestToWorkResponse
}

export namespace EffectProtocolMessage {
  let _codec: Codec<EffectProtocolMessage>

  export const codec = (): Codec<EffectProtocolMessage> => {
    if (_codec == null) {
      _codec = message<EffectProtocolMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.task != null) {
          w.uint32(10)
          Task.codec().encode(obj.task, w)
        }

        if (obj.taskAccepted != null) {
          w.uint32(18)
          TaskAccepted.codec().encode(obj.taskAccepted, w)
        }

        if (obj.taskRejected != null) {
          w.uint32(26)
          TaskRejected.codec().encode(obj.taskRejected, w)
        }

        if (obj.taskCompleted != null) {
          w.uint32(34)
          TaskCompleted.codec().encode(obj.taskCompleted, w)
        }

        if (obj.payment != null) {
          w.uint32(42)
          Payment.codec().encode(obj.payment, w)
        }

        if (obj.payoutRequest != null) {
          w.uint32(50)
          PayoutRequest.codec().encode(obj.payoutRequest, w)
        }

        if (obj.proofRequest != null) {
          w.uint32(58)
          ProofRequest.codec().encode(obj.proofRequest, w)
        }

        if (obj.proofResponse != null) {
          w.uint32(66)
          ProofResponse.codec().encode(obj.proofResponse, w)
        }

        if (obj.templateRequest != null) {
          w.uint32(74)
          TemplateRequest.codec().encode(obj.templateRequest, w)
        }

        if (obj.templateResponse != null) {
          w.uint32(82)
          Template.codec().encode(obj.templateResponse, w)
        }

        if (obj.error != null) {
          w.uint32(90)
          EffectError.codec().encode(obj.error, w)
        }

        if (obj.ack != null) {
          w.uint32(98)
          EffectAcknowledgment.codec().encode(obj.ack, w)
        }

        if (obj.requestToWork != null) {
          w.uint32(106)
          RequestToWork.codec().encode(obj.requestToWork, w)
        }

        if (obj.requestToWorkResponse != null) {
          w.uint32(114)
          RequestToWorkResponse.codec().encode(obj.requestToWorkResponse, w)
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
              obj.task = Task.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.task
              })
              break
            }
            case 2: {
              obj.taskAccepted = TaskAccepted.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.taskAccepted
              })
              break
            }
            case 3: {
              obj.taskRejected = TaskRejected.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.taskRejected
              })
              break
            }
            case 4: {
              obj.taskCompleted = TaskCompleted.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.taskCompleted
              })
              break
            }
            case 5: {
              obj.payment = Payment.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.payment
              })
              break
            }
            case 6: {
              obj.payoutRequest = PayoutRequest.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.payoutRequest
              })
              break
            }
            case 7: {
              obj.proofRequest = ProofRequest.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.proofRequest
              })
              break
            }
            case 8: {
              obj.proofResponse = ProofResponse.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.proofResponse
              })
              break
            }
            case 9: {
              obj.templateRequest = TemplateRequest.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.templateRequest
              })
              break
            }
            case 10: {
              obj.templateResponse = Template.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.templateResponse
              })
              break
            }
            case 11: {
              obj.error = EffectError.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.error
              })
              break
            }
            case 12: {
              obj.ack = EffectAcknowledgment.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.ack
              })
              break
            }
            case 13: {
              obj.requestToWork = RequestToWork.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.requestToWork
              })
              break
            }
            case 14: {
              obj.requestToWorkResponse = RequestToWorkResponse.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.requestToWorkResponse
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

  export const encode = (obj: Partial<EffectProtocolMessage>): Uint8Array => {
    return encodeMessage(obj, EffectProtocolMessage.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<EffectProtocolMessage>): EffectProtocolMessage => {
    return decodeMessage(buf, EffectProtocolMessage.codec(), opts)
  }
}

export interface PaymentMessage {
  payment?: Payment
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

export interface Payment {
  amount: bigint
  recipient: string
  paymentAccount: string
  nonce: bigint
  signature?: PaymentSignature
  label?: string
}

export namespace Payment {
  let _codec: Codec<Payment>

  export const codec = (): Codec<Payment> => {
    if (_codec == null) {
      _codec = message<Payment>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.amount != null && obj.amount !== 0n)) {
          w.uint32(16)
          w.uint64(obj.amount)
        }

        if ((obj.recipient != null && obj.recipient !== '')) {
          w.uint32(26)
          w.string(obj.recipient)
        }

        if ((obj.paymentAccount != null && obj.paymentAccount !== '')) {
          w.uint32(34)
          w.string(obj.paymentAccount)
        }

        if ((obj.nonce != null && obj.nonce !== 0n)) {
          w.uint32(40)
          w.uint64(obj.nonce)
        }

        if (obj.signature != null) {
          w.uint32(50)
          PaymentSignature.codec().encode(obj.signature, w)
        }

        if (obj.label != null) {
          w.uint32(58)
          w.string(obj.label)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          amount: 0n,
          recipient: '',
          paymentAccount: '',
          nonce: 0n
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 2: {
              obj.amount = reader.uint64()
              break
            }
            case 3: {
              obj.recipient = reader.string()
              break
            }
            case 4: {
              obj.paymentAccount = reader.string()
              break
            }
            case 5: {
              obj.nonce = reader.uint64()
              break
            }
            case 6: {
              obj.signature = PaymentSignature.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.signature
              })
              break
            }
            case 7: {
              obj.label = reader.string()
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

export interface PaymentSignature {
  R8?: R8Pair
  S: string
}

export namespace PaymentSignature {
  let _codec: Codec<PaymentSignature>

  export const codec = (): Codec<PaymentSignature> => {
    if (_codec == null) {
      _codec = message<PaymentSignature>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.R8 != null) {
          w.uint32(10)
          R8Pair.codec().encode(obj.R8, w)
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
              obj.R8 = R8Pair.codec().decode(reader, reader.uint32(), {
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

export interface Signals {
  minNonce: string
  maxNonce: string
  amount: bigint
}

export namespace Signals {
  let _codec: Codec<Signals>

  export const codec = (): Codec<Signals> => {
    if (_codec == null) {
      _codec = message<Signals>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.minNonce != null && obj.minNonce !== '')) {
          w.uint32(10)
          w.string(obj.minNonce)
        }

        if ((obj.maxNonce != null && obj.maxNonce !== '')) {
          w.uint32(18)
          w.string(obj.maxNonce)
        }

        if ((obj.amount != null && obj.amount !== 0n)) {
          w.uint32(24)
          w.uint64(obj.amount)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          minNonce: '',
          maxNonce: '',
          amount: 0n
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.minNonce = reader.string()
              break
            }
            case 2: {
              obj.maxNonce = reader.string()
              break
            }
            case 3: {
              obj.amount = reader.uint64()
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

  export const encode = (obj: Partial<Signals>): Uint8Array => {
    return encodeMessage(obj, Signals.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Signals>): Signals => {
    return decodeMessage(buf, Signals.codec(), opts)
  }
}

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

export interface ProofResponse {
  piA: string[]
  piB: Matrix[]
  piC: string[]
  protocol: string
  curve: string
  signals?: Signals
  r8?: R8Pair
}

export namespace ProofResponse {
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
            Matrix.codec().encode(value, w)
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

        if (obj.signals != null) {
          w.uint32(50)
          Signals.codec().encode(obj.signals, w)
        }

        if (obj.r8 != null) {
          w.uint32(58)
          R8Pair.codec().encode(obj.r8, w)
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

              obj.piB.push(Matrix.codec().decode(reader, reader.uint32(), {
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
            case 6: {
              obj.signals = Signals.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.signals
              })
              break
            }
            case 7: {
              obj.r8 = R8Pair.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.r8
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

  export const encode = (obj: Partial<ProofResponse>): Uint8Array => {
    return encodeMessage(obj, ProofResponse.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<ProofResponse>): ProofResponse => {
    return decodeMessage(buf, ProofResponse.codec(), opts)
  }
}

export interface ProofRequest {
  batchSize: number
  payments: ProofRequest.PaymentProof[]
}

export namespace ProofRequest {
  export interface PaymentProof {
    signature?: PaymentSignature
    amount: bigint
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

          if ((obj.amount != null && obj.amount !== 0n)) {
            w.uint32(16)
            w.uint64(obj.amount)
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
            amount: 0n,
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
                obj.amount = reader.uint64()
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

export interface TaskMessage {
  taskId: string
  task?: Task
  taskAccepted?: TaskAccepted
  taskRejected?: TaskRejected
  taskCompleted?: TaskCompleted
  template?: Template
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

        if (obj.template != null) {
          w.uint32(50)
          Template.codec().encode(obj.template, w)
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
            case 6: {
              obj.template = Template.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.template
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

export enum TaskStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

enum __TaskStatusValues {
  PENDING = 0,
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
  id: string
  title: string
  reward: bigint
  timeLimitSeconds: number
  templateId: string
  templateData: string
}

export namespace Task {
  let _codec: Codec<Task>

  export const codec = (): Codec<Task> => {
    if (_codec == null) {
      _codec = message<Task>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.id != null && obj.id !== '')) {
          w.uint32(10)
          w.string(obj.id)
        }

        if ((obj.title != null && obj.title !== '')) {
          w.uint32(18)
          w.string(obj.title)
        }

        if ((obj.reward != null && obj.reward !== 0n)) {
          w.uint32(24)
          w.uint64(obj.reward)
        }

        if ((obj.timeLimitSeconds != null && obj.timeLimitSeconds !== 0)) {
          w.uint32(32)
          w.uint32(obj.timeLimitSeconds)
        }

        if ((obj.templateId != null && obj.templateId !== '')) {
          w.uint32(42)
          w.string(obj.templateId)
        }

        if ((obj.templateData != null && obj.templateData !== '')) {
          w.uint32(50)
          w.string(obj.templateData)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          id: '',
          title: '',
          reward: 0n,
          timeLimitSeconds: 0,
          templateId: '',
          templateData: ''
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
              obj.title = reader.string()
              break
            }
            case 3: {
              obj.reward = reader.uint64()
              break
            }
            case 4: {
              obj.timeLimitSeconds = reader.uint32()
              break
            }
            case 5: {
              obj.templateId = reader.string()
              break
            }
            case 6: {
              obj.templateData = reader.string()
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

export interface TaskAssignment {
  peerId: string
  assignedAt?: number
  acceptedAt?: number
  completedAt?: number
  rejectedAt?: number
}

export namespace TaskAssignment {
  let _codec: Codec<TaskAssignment>

  export const codec = (): Codec<TaskAssignment> => {
    if (_codec == null) {
      _codec = message<TaskAssignment>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.peerId != null && obj.peerId !== '')) {
          w.uint32(10)
          w.string(obj.peerId)
        }

        if (obj.assignedAt != null) {
          w.uint32(16)
          w.uint32(obj.assignedAt)
        }

        if (obj.acceptedAt != null) {
          w.uint32(24)
          w.uint32(obj.acceptedAt)
        }

        if (obj.completedAt != null) {
          w.uint32(32)
          w.uint32(obj.completedAt)
        }

        if (obj.rejectedAt != null) {
          w.uint32(40)
          w.uint32(obj.rejectedAt)
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
            case 2: {
              obj.assignedAt = reader.uint32()
              break
            }
            case 3: {
              obj.acceptedAt = reader.uint32()
              break
            }
            case 4: {
              obj.completedAt = reader.uint32()
              break
            }
            case 5: {
              obj.rejectedAt = reader.uint32()
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

  export const encode = (obj: Partial<TaskAssignment>): Uint8Array => {
    return encodeMessage(obj, TaskAssignment.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<TaskAssignment>): TaskAssignment => {
    return decodeMessage(buf, TaskAssignment.codec(), opts)
  }
}

export interface TaskAccepted {
  taskId: string
  worker: string
  timestamp: number
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

        if ((obj.timestamp != null && obj.timestamp !== 0)) {
          w.uint32(24)
          w.uint32(obj.timestamp)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          worker: '',
          timestamp: 0
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
              obj.timestamp = reader.uint32()
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
  timestamp: number
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

        if ((obj.timestamp != null && obj.timestamp !== 0)) {
          w.uint32(32)
          w.uint32(obj.timestamp)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          worker: '',
          reason: '',
          timestamp: 0
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
              obj.timestamp = reader.uint32()
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

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          worker: '',
          result: ''
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

export interface TemplateRequest {
  templateId: string
}

export namespace TemplateRequest {
  let _codec: Codec<TemplateRequest>

  export const codec = (): Codec<TemplateRequest> => {
    if (_codec == null) {
      _codec = message<TemplateRequest>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.templateId != null && obj.templateId !== '')) {
          w.uint32(10)
          w.string(obj.templateId)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          templateId: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.templateId = reader.string()
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

  export const encode = (obj: Partial<TemplateRequest>): Uint8Array => {
    return encodeMessage(obj, TemplateRequest.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<TemplateRequest>): TemplateRequest => {
    return decodeMessage(buf, TemplateRequest.codec(), opts)
  }
}

export interface Template {
  templateId: string
  title?: string
  description?: string
  createdAt: number
  data: string
}

export namespace Template {
  let _codec: Codec<Template>

  export const codec = (): Codec<Template> => {
    if (_codec == null) {
      _codec = message<Template>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.templateId != null && obj.templateId !== '')) {
          w.uint32(10)
          w.string(obj.templateId)
        }

        if (obj.title != null) {
          w.uint32(18)
          w.string(obj.title)
        }

        if (obj.description != null) {
          w.uint32(26)
          w.string(obj.description)
        }

        if ((obj.createdAt != null && obj.createdAt !== 0)) {
          w.uint32(32)
          w.uint32(obj.createdAt)
        }

        if ((obj.data != null && obj.data !== '')) {
          w.uint32(42)
          w.string(obj.data)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          templateId: '',
          createdAt: 0,
          data: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.templateId = reader.string()
              break
            }
            case 2: {
              obj.title = reader.string()
              break
            }
            case 3: {
              obj.description = reader.string()
              break
            }
            case 4: {
              obj.createdAt = reader.uint32()
              break
            }
            case 5: {
              obj.data = reader.string()
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

  export const encode = (obj: Partial<Template>): Uint8Array => {
    return encodeMessage(obj, Template.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Template>): Template => {
    return decodeMessage(buf, Template.codec(), opts)
  }
}
