# Effect AI P2P Tasking Infrastructure

Welcome to the Effect Tasking Mono Repo, this repository contains the neccesary packages for our tasking infrastructure to operate.

## Packages

| Package Name              | Description                                                                                                                                        | Version | Notes |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| `@effectai/task-core`     | Core module that defines the tasking infrastructure, shared utilities, and protocols for the Effect Tasks network.                                 | 1.0.0   | -     |
| `@effectai/task-provider` | SDK for task providers to post encrypted tasks (batches) on-chain and manage interactions with manager nodes                                       | 1.0.0   | -     |
| `@effectai/task-manager`  | Libp2p-based implementation of a manager node, responsible for assigning tasks to worker nodes and validating results. Built for Node.js           | 1.0.0   | -     |
| `@effectai/task-worker`   | Libp2p-based implementation of a worker node, designed for browser environments, allowing workers to receive and execute tasks from manager nodes. | 1.0.0   | -     |

# Installation

### Prerequisites

Most machines are good to go with just:

```
corepack enable pnpm
```

If that doesn't do the trick, [check out the installation guide](https://pnpm.io/installation) for other ways to get it set up.

## Scripts

Clone and run:

`pnpm install`

to run tests:

`pnpm vitest`
