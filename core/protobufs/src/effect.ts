/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable import/consistent-type-specifier-style */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { decodeMessage, encodeMessage, enumeration, MaxLengthError, message } from 'protons-runtime'
import { alloc as uint8ArrayAlloc } from 'uint8arrays/alloc'
import type { Codec, DecodeOptions } from 'protons-runtime'
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

export interface EffectIdentifyRequest {
  timestamp: number
}

export namespace EffectIdentifyRequest {
  let _codec: Codec<EffectIdentifyRequest>

  export const codec = (): Codec<EffectIdentifyRequest> => {
    if (_codec == null) {
      _codec = message<EffectIdentifyRequest>((obj, w, opts = {}) => {
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

  export const encode = (obj: Partial<EffectIdentifyRequest>): Uint8Array => {
    return encodeMessage(obj, EffectIdentifyRequest.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<EffectIdentifyRequest>): EffectIdentifyRequest => {
    return decodeMessage(buf, EffectIdentifyRequest.codec(), opts)
  }
}

export interface EffectIdentifyResponse {
  name?: string
  version: string
  peer: Uint8Array
  pubkey: string
  batchSize: number
  taskTimeout: number
  requiresRegistration: boolean
  isRegistered: boolean
  isConnected: boolean
}

export namespace EffectIdentifyResponse {
  let _codec: Codec<EffectIdentifyResponse>

  export const codec = (): Codec<EffectIdentifyResponse> => {
    if (_codec == null) {
      _codec = message<EffectIdentifyResponse>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.name != null) {
          w.uint32(10)
          w.string(obj.name)
        }

        if ((obj.version != null && obj.version !== '')) {
          w.uint32(18)
          w.string(obj.version)
        }

        if ((obj.peer != null && obj.peer.byteLength > 0)) {
          w.uint32(26)
          w.bytes(obj.peer)
        }

        if ((obj.pubkey != null && obj.pubkey !== '')) {
          w.uint32(34)
          w.string(obj.pubkey)
        }

        if ((obj.batchSize != null && obj.batchSize !== 0)) {
          w.uint32(40)
          w.uint32(obj.batchSize)
        }

        if ((obj.taskTimeout != null && obj.taskTimeout !== 0)) {
          w.uint32(48)
          w.uint32(obj.taskTimeout)
        }

        if ((obj.requiresRegistration != null && obj.requiresRegistration !== false)) {
          w.uint32(56)
          w.bool(obj.requiresRegistration)
        }

        if ((obj.isRegistered != null && obj.isRegistered !== false)) {
          w.uint32(64)
          w.bool(obj.isRegistered)
        }

        if ((obj.isConnected != null && obj.isConnected !== false)) {
          w.uint32(72)
          w.bool(obj.isConnected)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          version: '',
          peer: uint8ArrayAlloc(0),
          pubkey: '',
          batchSize: 0,
          taskTimeout: 0,
          requiresRegistration: false,
          isRegistered: false,
          isConnected: false
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.name = reader.string()
              break
            }
            case 2: {
              obj.version = reader.string()
              break
            }
            case 3: {
              obj.peer = reader.bytes()
              break
            }
            case 4: {
              obj.pubkey = reader.string()
              break
            }
            case 5: {
              obj.batchSize = reader.uint32()
              break
            }
            case 6: {
              obj.taskTimeout = reader.uint32()
              break
            }
            case 7: {
              obj.requiresRegistration = reader.bool()
              break
            }
            case 8: {
              obj.isRegistered = reader.bool()
              break
            }
            case 9: {
              obj.isConnected = reader.bool()
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

  export const encode = (obj: Partial<EffectIdentifyResponse>): Uint8Array => {
    return encodeMessage(obj, EffectIdentifyResponse.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<EffectIdentifyResponse>): EffectIdentifyResponse => {
    return decodeMessage(buf, EffectIdentifyResponse.codec(), opts)
  }
}

export interface RequestToWork {
  timestamp: number
  recipient: string
  nonce: bigint
  capabilities: string
  accessCode?: string
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

        if ((obj.capabilities != null && obj.capabilities !== '')) {
          w.uint32(34)
          w.string(obj.capabilities)
        }

        if (obj.accessCode != null) {
          w.uint32(42)
          w.string(obj.accessCode)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          timestamp: 0,
          recipient: '',
          nonce: 0n,
          capabilities: ''
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
            case 4: {
              obj.capabilities = reader.string()
              break
            }
            case 5: {
              obj.accessCode = reader.string()
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
  timestamp: number
  pubkey: string
  peer: string
}

export namespace RequestToWorkResponse {
  let _codec: Codec<RequestToWorkResponse>

  export const codec = (): Codec<RequestToWorkResponse> => {
    if (_codec == null) {
      _codec = message<RequestToWorkResponse>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.timestamp != null && obj.timestamp !== 0)) {
          w.uint32(8)
          w.uint32(obj.timestamp)
        }

        if ((obj.pubkey != null && obj.pubkey !== '')) {
          w.uint32(18)
          w.string(obj.pubkey)
        }

        if ((obj.peer != null && obj.peer !== '')) {
          w.uint32(26)
          w.string(obj.peer)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          timestamp: 0,
          pubkey: '',
          peer: ''
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
              obj.pubkey = reader.string()
              break
            }
            case 3: {
              obj.peer = reader.string()
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
  identifyRequest?: EffectIdentifyRequest
  identifyResponse?: EffectIdentifyResponse
  bulkProofRequest?: BulkProofRequest
}

export namespace EffectProtocolMessage {
  let _codec: Codec<EffectProtocolMessage>

  export const codec = (): Codec<EffectProtocolMessage> => {
    if (_codec == null) {
      _codec = message<EffectProtocolMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        obj = { ...obj }

        if (obj.bulkProofRequest != null) {
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.identifyResponse != null) {
          obj.bulkProofRequest = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.identifyRequest != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.requestToWorkResponse != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.requestToWork != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.ack != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.error != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.templateResponse != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.templateRequest != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.proofResponse != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.proofRequest != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.payoutRequest != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.payment != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.taskCompleted != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.taskRejected != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.taskAccepted != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.task = undefined
        }

        if (obj.task != null) {
          obj.bulkProofRequest = undefined
          obj.identifyResponse = undefined
          obj.identifyRequest = undefined
          obj.requestToWorkResponse = undefined
          obj.requestToWork = undefined
          obj.ack = undefined
          obj.error = undefined
          obj.templateResponse = undefined
          obj.templateRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payoutRequest = undefined
          obj.payment = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
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

        if (obj.identifyRequest != null) {
          w.uint32(122)
          EffectIdentifyRequest.codec().encode(obj.identifyRequest, w)
        }

        if (obj.identifyResponse != null) {
          w.uint32(130)
          EffectIdentifyResponse.codec().encode(obj.identifyResponse, w)
        }

        if (obj.bulkProofRequest != null) {
          w.uint32(138)
          BulkProofRequest.codec().encode(obj.bulkProofRequest, w)
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
            case 15: {
              obj.identifyRequest = EffectIdentifyRequest.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.identifyRequest
              })
              break
            }
            case 16: {
              obj.identifyResponse = EffectIdentifyResponse.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.identifyResponse
              })
              break
            }
            case 17: {
              obj.bulkProofRequest = BulkProofRequest.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.bulkProofRequest
              })
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }

        if (obj.bulkProofRequest != null) {
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.identifyResponse != null) {
          delete obj.bulkProofRequest
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.identifyRequest != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.requestToWorkResponse != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.requestToWork != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.ack != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.error != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.templateResponse != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.templateRequest != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.proofResponse != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.proofRequest != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.payoutRequest != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.payment != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.taskCompleted != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.taskRejected != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.taskAccepted != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.task
        }

        if (obj.task != null) {
          delete obj.bulkProofRequest
          delete obj.identifyResponse
          delete obj.identifyRequest
          delete obj.requestToWorkResponse
          delete obj.requestToWork
          delete obj.ack
          delete obj.error
          delete obj.templateResponse
          delete obj.templateRequest
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payoutRequest
          delete obj.payment
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
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

        obj = { ...obj }

        if (obj.payoutRequest != null) {
          obj.proofResponse = undefined
          obj.proofRequest = undefined
          obj.payment = undefined
        }

        if (obj.proofResponse != null) {
          obj.payoutRequest = undefined
          obj.proofRequest = undefined
          obj.payment = undefined
        }

        if (obj.proofRequest != null) {
          obj.payoutRequest = undefined
          obj.proofResponse = undefined
          obj.payment = undefined
        }

        if (obj.payment != null) {
          obj.payoutRequest = undefined
          obj.proofResponse = undefined
          obj.proofRequest = undefined
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

        if (obj.payoutRequest != null) {
          delete obj.proofResponse
          delete obj.proofRequest
          delete obj.payment
        }

        if (obj.proofResponse != null) {
          delete obj.payoutRequest
          delete obj.proofRequest
          delete obj.payment
        }

        if (obj.proofRequest != null) {
          delete obj.payoutRequest
          delete obj.proofResponse
          delete obj.payment
        }

        if (obj.payment != null) {
          delete obj.payoutRequest
          delete obj.proofResponse
          delete obj.proofRequest
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
  id: string
  version: number
  amount: bigint
  recipient: string
  paymentAccount: string
  nonce: bigint
  publicKey: string
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

        if ((obj.id != null && obj.id !== '')) {
          w.uint32(10)
          w.string(obj.id)
        }

        if ((obj.version != null && obj.version !== 0)) {
          w.uint32(16)
          w.uint32(obj.version)
        }

        if ((obj.amount != null && obj.amount !== 0n)) {
          w.uint32(24)
          w.uint64(obj.amount)
        }

        if ((obj.recipient != null && obj.recipient !== '')) {
          w.uint32(34)
          w.string(obj.recipient)
        }

        if ((obj.paymentAccount != null && obj.paymentAccount !== '')) {
          w.uint32(42)
          w.string(obj.paymentAccount)
        }

        if ((obj.nonce != null && obj.nonce !== 0n)) {
          w.uint32(48)
          w.uint64(obj.nonce)
        }

        if ((obj.publicKey != null && obj.publicKey !== '')) {
          w.uint32(58)
          w.string(obj.publicKey)
        }

        if (obj.signature != null) {
          w.uint32(66)
          PaymentSignature.codec().encode(obj.signature, w)
        }

        if (obj.label != null) {
          w.uint32(74)
          w.string(obj.label)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          id: '',
          version: 0,
          amount: 0n,
          recipient: '',
          paymentAccount: '',
          nonce: 0n,
          publicKey: ''
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
              obj.version = reader.uint32()
              break
            }
            case 3: {
              obj.amount = reader.uint64()
              break
            }
            case 4: {
              obj.recipient = reader.string()
              break
            }
            case 5: {
              obj.paymentAccount = reader.string()
              break
            }
            case 6: {
              obj.nonce = reader.uint64()
              break
            }
            case 7: {
              obj.publicKey = reader.string()
              break
            }
            case 8: {
              obj.signature = PaymentSignature.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.signature
              })
              break
            }
            case 9: {
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

export interface Point {
  R8_1: string
  R8_2: string
}

export namespace Point {
  let _codec: Codec<Point>

  export const codec = (): Codec<Point> => {
    if (_codec == null) {
      _codec = message<Point>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.R8_1 != null && obj.R8_1 !== '')) {
          w.uint32(10)
          w.string(obj.R8_1)
        }

        if ((obj.R8_2 != null && obj.R8_2 !== '')) {
          w.uint32(18)
          w.string(obj.R8_2)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          R8_1: '',
          R8_2: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.R8_1 = reader.string()
              break
            }
            case 2: {
              obj.R8_2 = reader.string()
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

  export const encode = (obj: Partial<Point>): Uint8Array => {
    return encodeMessage(obj, Point.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Point>): Point => {
    return decodeMessage(buf, Point.codec(), opts)
  }
}

export interface PaymentSignature {
  R8?: Point
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
          Point.codec().encode(obj.R8, w)
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
              obj.R8 = Point.codec().decode(reader, reader.uint32(), {
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
  amount: string
  recipient: string
  paymentAccount: string
  pubX: string
  pubY: string
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

        if ((obj.amount != null && obj.amount !== '')) {
          w.uint32(26)
          w.string(obj.amount)
        }

        if ((obj.recipient != null && obj.recipient !== '')) {
          w.uint32(34)
          w.string(obj.recipient)
        }

        if ((obj.paymentAccount != null && obj.paymentAccount !== '')) {
          w.uint32(42)
          w.string(obj.paymentAccount)
        }

        if ((obj.pubX != null && obj.pubX !== '')) {
          w.uint32(50)
          w.string(obj.pubX)
        }

        if ((obj.pubY != null && obj.pubY !== '')) {
          w.uint32(58)
          w.string(obj.pubY)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          minNonce: '',
          maxNonce: '',
          amount: '',
          recipient: '',
          paymentAccount: '',
          pubX: '',
          pubY: ''
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
              obj.amount = reader.string()
              break
            }
            case 4: {
              obj.recipient = reader.string()
              break
            }
            case 5: {
              obj.paymentAccount = reader.string()
              break
            }
            case 6: {
              obj.pubX = reader.string()
              break
            }
            case 7: {
              obj.pubY = reader.string()
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

export interface ProofResponse {
  piA: string[]
  piB: ProofResponse.Matrix[]
  piC: string[]
  protocol: string
  curve: string
  signals?: Signals
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

        if (obj.signals != null) {
          w.uint32(50)
          Signals.codec().encode(obj.signals, w)
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
            case 6: {
              obj.signals = Signals.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.signals
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

export interface BulkProofRequest {
  recipient: string
  paymentAccount: string
  proofs: ProofResponse[]
}

export namespace BulkProofRequest {
  let _codec: Codec<BulkProofRequest>

  export const codec = (): Codec<BulkProofRequest> => {
    if (_codec == null) {
      _codec = message<BulkProofRequest>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.recipient != null && obj.recipient !== '')) {
          w.uint32(10)
          w.string(obj.recipient)
        }

        if ((obj.paymentAccount != null && obj.paymentAccount !== '')) {
          w.uint32(18)
          w.string(obj.paymentAccount)
        }

        if (obj.proofs != null) {
          for (const value of obj.proofs) {
            w.uint32(26)
            ProofResponse.codec().encode(value, w)
          }
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          recipient: '',
          paymentAccount: '',
          proofs: []
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.recipient = reader.string()
              break
            }
            case 2: {
              obj.paymentAccount = reader.string()
              break
            }
            case 3: {
              if (opts.limits?.proofs != null && obj.proofs.length === opts.limits.proofs) {
                throw new MaxLengthError('Decode error - map field "proofs" had too many elements')
              }

              obj.proofs.push(ProofResponse.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.proofs$
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

  export const encode = (obj: Partial<BulkProofRequest>): Uint8Array => {
    return encodeMessage(obj, BulkProofRequest.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<BulkProofRequest>): BulkProofRequest => {
    return decodeMessage(buf, BulkProofRequest.codec(), opts)
  }
}

export interface ProofRequest {
  recipient: string
  paymentAccount: string
  publicKey: string
  payments: ProofRequest.PaymentProof[]
}

export namespace ProofRequest {
  export interface PaymentProof {
    signature?: PaymentSignature
    amount: bigint
    nonce: bigint
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

          if (opts.lengthDelimited !== false) {
            w.ldelim()
          }
        }, (reader, length, opts = {}) => {
          const obj: any = {
            amount: 0n,
            nonce: 0n
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

        if ((obj.recipient != null && obj.recipient !== '')) {
          w.uint32(10)
          w.string(obj.recipient)
        }

        if ((obj.paymentAccount != null && obj.paymentAccount !== '')) {
          w.uint32(18)
          w.string(obj.paymentAccount)
        }

        if ((obj.publicKey != null && obj.publicKey !== '')) {
          w.uint32(26)
          w.string(obj.publicKey)
        }

        if (obj.payments != null) {
          for (const value of obj.payments) {
            w.uint32(34)
            ProofRequest.PaymentProof.codec().encode(value, w)
          }
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          recipient: '',
          paymentAccount: '',
          publicKey: '',
          payments: []
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.recipient = reader.string()
              break
            }
            case 2: {
              obj.paymentAccount = reader.string()
              break
            }
            case 3: {
              obj.publicKey = reader.string()
              break
            }
            case 4: {
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

        obj = { ...obj }

        if (obj.template != null) {
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.taskCompleted != null) {
          obj.template = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.taskRejected != null) {
          obj.template = undefined
          obj.taskCompleted = undefined
          obj.taskAccepted = undefined
          obj.task = undefined
        }

        if (obj.taskAccepted != null) {
          obj.template = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.task = undefined
        }

        if (obj.task != null) {
          obj.template = undefined
          obj.taskCompleted = undefined
          obj.taskRejected = undefined
          obj.taskAccepted = undefined
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

        if (obj.template != null) {
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.taskCompleted != null) {
          delete obj.template
          delete obj.taskRejected
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.taskRejected != null) {
          delete obj.template
          delete obj.taskCompleted
          delete obj.taskAccepted
          delete obj.task
        }

        if (obj.taskAccepted != null) {
          delete obj.template
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.task
        }

        if (obj.task != null) {
          delete obj.template
          delete obj.taskCompleted
          delete obj.taskRejected
          delete obj.taskAccepted
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
  capability?: string
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

        if (obj.capability != null) {
          w.uint32(58)
          w.string(obj.capability)
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
            case 7: {
              obj.capability = reader.string()
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
