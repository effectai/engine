/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface Challenge {
  id: string
  task?: Task
  answer: string
}

export namespace Challenge {
  let _codec: Codec<Challenge>

  export const codec = (): Codec<Challenge> => {
    if (_codec == null) {
      _codec = message<Challenge>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.id != null && obj.id !== '')) {
          w.uint32(10)
          w.string(obj.id)
        }

        if (obj.task != null) {
          w.uint32(18)
          Task.codec().encode(obj.task, w)
        }

        if ((obj.answer != null && obj.answer !== '')) {
          w.uint32(26)
          w.string(obj.answer)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          id: '',
          answer: ''
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
              obj.task = Task.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.task
              })
              break
            }
            case 3: {
              obj.answer = reader.string()
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

  export const encode = (obj: Partial<Challenge>): Uint8Array => {
    return encodeMessage(obj, Challenge.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Challenge>): Challenge => {
    return decodeMessage(buf, Challenge.codec(), opts)
  }
}

export enum TaskStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  IN_PROGRESS = 'IN_PROGRESS'
}

enum __TaskStatusValues {
  CREATED = 0,
  ASSIGNED = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  IN_PROGRESS = 4
}

export namespace TaskStatus {
  export const codec = (): Codec<TaskStatus> => {
    return enumeration<TaskStatus>(__TaskStatusValues)
  }
}
export interface Task {
  id: string
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

        if ((obj.id != null && obj.id !== '')) {
          w.uint32(2)
          w.string(obj.id)
        }

        if ((obj.manager != null && obj.manager !== '')) {
          w.uint32(10)
          w.string(obj.manager)
        }

        if ((obj.created != null && obj.created !== '')) {
          w.uint32(18)
          w.string(obj.created)
        }

        if ((obj.reward != null && obj.reward !== '')) {
          w.uint32(26)
          w.string(obj.reward)
        }

        if ((obj.template != null && obj.template !== '')) {
          w.uint32(34)
          w.string(obj.template)
        }

        if ((obj.result != null && obj.result !== '')) {
          w.uint32(42)
          w.string(obj.result)
        }

        if ((obj.signature != null && obj.signature !== '')) {
          w.uint32(50)
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
          id: '',
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
            case 0: {
              obj.id = reader.string()
              break
            }
            case 1: {
              obj.manager = reader.string()
              break
            }
            case 2: {
              obj.created = reader.string()
              break
            }
            case 3: {
              obj.reward = reader.string()
              break
            }
            case 4: {
              obj.template = reader.string()
              break
            }
            case 5: {
              obj.result = reader.string()
              break
            }
            case 6: {
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
