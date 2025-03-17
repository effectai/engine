/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface WorkerMessage {
  task?: Task
  payment?: PaymentMessage
}

export namespace WorkerMessage {
  let _codec: Codec<WorkerMessage>

  export const codec = (): Codec<WorkerMessage> => {
    if (_codec == null) {
      _codec = message<WorkerMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.task != null) {
          w.uint32(10)
          Task.codec().encode(obj.task, w)
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
              obj.task = Task.codec().decode(reader, reader.uint32(), {
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

  export const encode = (obj: Partial<WorkerMessage>): Uint8Array => {
    return encodeMessage(obj, WorkerMessage.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<WorkerMessage>): WorkerMessage => {
    return decodeMessage(buf, WorkerMessage.codec(), opts)
  }
}

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
