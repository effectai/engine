/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

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
  title: string
  manager: string
  created: string
  reward: bigint
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

        if ((obj.title != null && obj.title !== '')) {
          w.uint32(18)
          w.string(obj.title)
        }

        if ((obj.manager != null && obj.manager !== '')) {
          w.uint32(26)
          w.string(obj.manager)
        }

        if ((obj.created != null && obj.created !== '')) {
          w.uint32(34)
          w.string(obj.created)
        }

        if ((obj.reward != null && obj.reward !== 0n)) {
          w.uint32(40)
          w.uint64(obj.reward)
        }

        if ((obj.template != null && obj.template !== '')) {
          w.uint32(50)
          w.string(obj.template)
        }

        if ((obj.result != null && obj.result !== '')) {
          w.uint32(58)
          w.string(obj.result)
        }

        if ((obj.signature != null && obj.signature !== '')) {
          w.uint32(66)
          w.string(obj.signature)
        }

        if (obj.status != null && __TaskStatusValues[obj.status] !== 0) {
          w.uint32(72)
          TaskStatus.codec().encode(obj.status, w)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          title: '',
          manager: '',
          created: '',
          reward: 0n,
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
              obj.title = reader.string()
              break
            }
            case 3: {
              obj.manager = reader.string()
              break
            }
            case 4: {
              obj.created = reader.string()
              break
            }
            case 5: {
              obj.reward = reader.uint64()
              break
            }
            case 6: {
              obj.template = reader.string()
              break
            }
            case 7: {
              obj.result = reader.string()
              break
            }
            case 8: {
              obj.signature = reader.string()
              break
            }
            case 9: {
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
