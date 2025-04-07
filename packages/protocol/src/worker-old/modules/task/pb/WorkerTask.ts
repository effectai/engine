/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface WorkerTask {
  task?: Task
  assignment?: TaskAssignment
}

export namespace WorkerTask {
  let _codec: Codec<WorkerTask>

  export const codec = (): Codec<WorkerTask> => {
    if (_codec == null) {
      _codec = message<WorkerTask>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.task != null) {
          w.uint32(10)
          Task.codec().encode(obj.task, w)
        }

        if (obj.assignment != null) {
          w.uint32(18)
          TaskAssignment.codec().encode(obj.assignment, w)
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
              obj.assignment = TaskAssignment.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.assignment
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

  export const encode = (obj: Partial<WorkerTask>): Uint8Array => {
    return encodeMessage(obj, WorkerTask.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<WorkerTask>): WorkerTask => {
    return decodeMessage(buf, WorkerTask.codec(), opts)
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
  taskId: string
  title: string
  createdAt: string
  reward: bigint
  timeLimitSeconds: number
  template: string
  status: TaskStatus
  result?: string
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

        if ((obj.createdAt != null && obj.createdAt !== '')) {
          w.uint32(26)
          w.string(obj.createdAt)
        }

        if ((obj.reward != null && obj.reward !== 0n)) {
          w.uint32(32)
          w.uint64(obj.reward)
        }

        if ((obj.timeLimitSeconds != null && obj.timeLimitSeconds !== 0)) {
          w.uint32(40)
          w.uint32(obj.timeLimitSeconds)
        }

        if ((obj.template != null && obj.template !== '')) {
          w.uint32(50)
          w.string(obj.template)
        }

        if (obj.status != null && __TaskStatusValues[obj.status] !== 0) {
          w.uint32(56)
          TaskStatus.codec().encode(obj.status, w)
        }

        if (obj.result != null) {
          w.uint32(66)
          w.string(obj.result)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          taskId: '',
          title: '',
          createdAt: '',
          reward: 0n,
          timeLimitSeconds: 0,
          template: '',
          status: TaskStatus.PENDING
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
              obj.createdAt = reader.string()
              break
            }
            case 4: {
              obj.reward = reader.uint64()
              break
            }
            case 5: {
              obj.timeLimitSeconds = reader.uint32()
              break
            }
            case 6: {
              obj.template = reader.string()
              break
            }
            case 7: {
              obj.status = TaskStatus.codec().decode(reader)
              break
            }
            case 8: {
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
