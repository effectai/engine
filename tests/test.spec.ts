// sum.test.js
import { expect, test } from 'vitest'

import { createManagerNode } from 'packages/manager'

export function sum(a: number, b: number) {
    return a + b
}

test('creates a manager node', async () => {
    await createManagerNode()
})