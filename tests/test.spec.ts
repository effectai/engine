// sum.test.js
import { expect, test, afterEach, beforeEach } from 'vitest'

import type {Libp2p} from 'libp2p'
import { createManagerNode } from 'packages/manager'
import { createWorkerNode } from 'packages/worker'
import { multiaddr } from '@multiformats/multiaddr'

let manager: Libp2p, worker: Libp2p

beforeEach(async () => {
    manager = await createManagerNode()
    worker = await createWorkerNode()
    await manager.start();
    await worker.start();
})

afterEach(async () => {
   await manager.stop()
   await worker.stop()
})


test('dials the manager node', async () => {
    const managerAddress = multiaddr('/dns4/localhost/tcp/15000/ws');
    const connection = await worker.dial(managerAddress)

    // send hello from worker to manager
    const stream = await connection.newStream('/task-flow/1.0.0')
    await stream.sink([Buffer.from('hello from workerrr')])

    // close connection
    await connection.close()
})
