/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, MaxSizeError, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export enum TaskStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

enum __TaskStatusValues {
  CREATED = 0,
  ASSIGNED = 1,
  IN_PROGRESS = 4,
  CANCELLED = 3,
  COMPLETED = 2
}

export namespace TaskStatus {
  export const codec = (): Codec<TaskStatus> => {
    return enumeration<TaskStatus>(__TaskStatusValues)
  }
}
export interface Task {
  id: string
  owner: string
  manager: string
  created: string
  signature: string
  status: TaskStatus
  reward: string
  template: string
  data: Map<string, string>
  result: string
}

export namespace Task {
  export interface Task$dataEntry {
    key: string
    value: string
  }

  export namespace Task$dataEntry {
    let _codec: Codec<Task$dataEntry>

    export const codec = (): Codec<Task$dataEntry> => {
      if (_codec == null) {
        _codec = message<Task$dataEntry>((obj, w, opts = {}) => {
          if (opts.lengthDelimited !== false) {
            w.fork()
          }

          if ((obj.key != null && obj.key !== '')) {
            w.uint32(10)
            w.string(obj.key)
          }

          if ((obj.value != null && obj.value !== '')) {
            w.uint32(18)
            w.string(obj.value)
          }

          if (opts.lengthDelimited !== false) {
            w.ldelim()
          }
        }, (reader, length, opts = {}) => {
          const obj: any = {
            key: '',
            value: ''
          }

          const end = length == null ? reader.len : reader.pos + length

          while (reader.pos < end) {
            const tag = reader.uint32()

            switch (tag >>> 3) {
              case 1: {
                obj.key = reader.string()
                break
              }
              case 2: {
                obj.value = reader.string()
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

    export const encode = (obj: Partial<Task$dataEntry>): Uint8Array => {
      return encodeMessage(obj, Task$dataEntry.codec())
    }

    export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Task$dataEntry>): Task$dataEntry => {
      return decodeMessage(buf, Task$dataEntry.codec(), opts)
    }
  }

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

        if ((obj.owner != null && obj.owner !== '')) {
          w.uint32(10)
          w.string(obj.owner)
        }

        if ((obj.manager != null && obj.manager !== '')) {
          w.uint32(18)
          w.string(obj.manager)
        }

        if ((obj.created != null && obj.created !== '')) {
          w.uint32(26)
          w.string(obj.created)
        }

        if ((obj.signature != null && obj.signature !== '')) {
          w.uint32(34)
          w.string(obj.signature)
        }

        if (obj.status != null && __TaskStatusValues[obj.status] !== 0) {
          w.uint32(40)
          TaskStatus.codec().encode(obj.status, w)
        }

        if ((obj.reward != null && obj.reward !== '')) {
          w.uint32(50)
          w.string(obj.reward)
        }

        if ((obj.template != null && obj.template !== '')) {
          w.uint32(58)
          w.string(obj.template)
        }

        if (obj.data != null && obj.data.size !== 0) {
          for (const [key, value] of obj.data.entries()) {
            w.uint32(66)
            Task.Task$dataEntry.codec().encode({ key, value }, w)
          }
        }

        if ((obj.result != null && obj.result !== '')) {
          w.uint32(74)
          w.string(obj.result)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {
          id: '',
          owner: '',
          manager: '',
          created: '',
          signature: '',
          status: TaskStatus.CREATED,
          reward: '',
          template: '',
          data: new Map<string, string>(),
          result: ''
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
              obj.owner = reader.string()
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
              obj.signature = reader.string()
              break
            }
            case 5: {
              obj.status = TaskStatus.codec().decode(reader)
              break
            }
            case 6: {
              obj.reward = reader.string()
              break
            }
            case 7: {
              obj.template = reader.string()
              break
            }
            case 8: {
              if (opts.limits?.data != null && obj.data.size === opts.limits.data) {
                throw new MaxSizeError('Decode error - map field "data" had too many elements')
              }

              const entry = Task.Task$dataEntry.codec().decode(reader, reader.uint32())
              obj.data.set(entry.key, entry.value)
              break
            }
            case 9: {
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
