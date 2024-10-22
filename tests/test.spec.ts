import { expect, test, afterEach, beforeEach, it } from 'vitest'
import { ManagerNode} from 'packages/manager/src/manager'
import { WorkerNode } from 'packages/worker/src/worker'
import { Batch } from 'packages/core/dist'

const exampleBatch: Batch = {
    repetitions: 2,
    validationRate: 0.5,
    template: '<html><body><h1>{{title}}</h1><p>{{description}}</p> <input type="submit" value="submit"/> </body></html>',
    data: [
      {
        title: 'Task 1',
        description: 'This is task 1'
      },
      {
        title: 'Task 2',
        description: 'This is task 2'
      }
    ]
  }

let manager: ManagerNode, worker: WorkerNode

beforeEach(async () => {
    manager = new ManagerNode();
    worker = new WorkerNode();

    await manager.start(15000)
    await worker.start(15001)
  })

afterEach(async () => {
   await manager.stop()
   await worker.stop()
})

it('should correctly delegate tasks to workers', async () => {
  await manager.manageBatch(exampleBatch)
})
