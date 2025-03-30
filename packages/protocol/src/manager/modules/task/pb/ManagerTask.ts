/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, MaxLengthError, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface ManagerTask {
  task?: Task
  workerAssignment: WorkerAssignment[]
}

export namespace ManagerTask {
  let _codec: Codec<ManagerTask>

  export const codec = (): Codec<ManagerTask> => {
    if (_codec == null) {
      _codec = message<ManagerTask>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.task != null) {
          w.uint32(10)
          Task.codec().encode(obj.task, w)
        }

        if (obj.workerAssignment != null) {
          for (const value of obj.workerAssignment) {
            w.uint32(18)
            WorkerAssignment.codec().encode(value, w)
          }
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          workerAssignment: []
        }

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
              if (opts.limits?.workerAssignment != null && obj.workerAssignment.length === opts.limits.workerAssignment) {
                throw new MaxLengthError('Decode error - map field "workerAssignment" had too many elements')
              }

              obj.workerAssignment.push(WorkerAssignment.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.workerAssignment$
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

  export const encode = (obj: Partial<ManagerTask>): Uint8Array => {
    return encodeMessage(obj, ManagerTask.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<ManagerTask>): ManagerTask => {
    return decodeMessage(buf, ManagerTask.codec(), opts)
  }
}

export interface WorkerAssignment {
  workerId: string
  assignedAt?: string
  acceptedAt?: string
  completedAt?: string
  rejectedAt?: string
}

export namespace WorkerAssignment {
  let _codec: Codec<WorkerAssignment>

  export const codec = (): Codec<WorkerAssignment> => {
    if (_codec == null) {
      _codec = message<WorkerAssignment>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.workerId != null && obj.workerId !== '')) {
          w.uint32(10)
          w.string(obj.workerId)
        }

        if (obj.assignedAt != null) {
          w.uint32(18)
          w.string(obj.assignedAt)
        }

        if (obj.acceptedAt != null) {
          w.uint32(26)
          w.string(obj.acceptedAt)
        }

        if (obj.completedAt != null) {
          w.uint32(34)
          w.string(obj.completedAt)
        }

        if (obj.rejectedAt != null) {
          w.uint32(50)
          w.string(obj.rejectedAt)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          workerId: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.workerId = reader.string()
              break
            }
            case 2: {
              obj.assignedAt = reader.string()
              break
            }
            case 3: {
              obj.acceptedAt = reader.string()
              break
            }
            case 4: {
              obj.completedAt = reader.string()
              break
            }
            case 6: {
              obj.rejectedAt = reader.string()
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

  export const encode = (obj: Partial<WorkerAssignment>): Uint8Array => {
    return encodeMessage(obj, WorkerAssignment.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<WorkerAssignment>): WorkerAssignment => {
    return decodeMessage(buf, WorkerAssignment.codec(), opts)
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

        if ((obj.template != null && obj.template !== '')) {
          w.uint32(42)
          w.string(obj.template)
        }

        if (obj.status != null && __TaskStatusValues[obj.status] !== 0) {
          w.uint32(48)
          TaskStatus.codec().encode(obj.status, w)
        }

        if (obj.result != null) {
          w.uint32(58)
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
              obj.template = reader.string()
              break
            }
            case 6: {
              obj.status = TaskStatus.codec().decode(reader)
              break
            }
            case 7: {
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
