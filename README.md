<div align="center">
  <img src="https://effect.ai/img/effect-logo.svg" alt="Effect AI Logo" height="120" />

# **Task Execution Protocol**

**Permissionless AI Task Execution Engine. Verifiable. Decentralized. Scalable.**

  <br/>

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.0.0-blue.svg)
![Solana](https://img.shields.io/badge/solana-%3E%3D1.10.0-purple.svg)
![TypeScript](https://img.shields.io/badge/typescript-%3E%3D4.0.0-blue.svg)
![Docker](https://img.shields.io/badge/docker-%3E%3D20.10.0-blue.svg)

![GitHub Stars](https://img.shields.io/github/stars/effectai?style=social)

</div>

---

Welcome to the Effect AI Task Execution Engine Protocol Monorepo. This repository contains all the core packages and components required to run our decentralized, peer-to-peer tasking infrastructure.

## Packages

| Package                                                   | Description                                                                                                  | Version |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------- |
| **[`@effectai/protocol-core`](./packages/protocol-core)** | Core module defining the tasking infrastructure, protocols, and shared utilities for the Effect AI Protocol. | `1.0.0` |
| **[`@effectai/manager`](./packages/manager)**             | Manager node implementation in Typescript.                                                                   | `1.0.0` |
| **[`@effectai/worker`](./packages/worker)**               | Worker node implementation in Typescript.                                                                    | `1.0.0` |
| **[`@effectai/cli`](./packages/cli)**                     | General CLI tool for interacting with the Effect network (e.g., launching nodes, testing tasks).             | `1.0.0` |
| **[`@effectai/idl`](./packages/idl)**                     | Shared IDLs and utilities for interacting with Solana smart contracts.                                       | `1.0.0` |
| **[`@effectai/zkp`](./packages/zkp)**                     | Zero-knowledge proof circuits, inputs, and verifiers for task and payment validation.                        | `1.0.0` |
| **[`@effectai/templates`](./packages/templates)**         | Task templates and predefined schemas for common task types.                                                 | `1.0.0` |
| **[`@effectai/program-sdk`](./packages/program-sdk)**     | SDK for interacting with the Effect smart contracts on Solana.                                               | `1.0.0` |

# 🚀 Getting Started

### Prerequisites

- Node.js >= 23.x
- pnpm >= 10.x

### Install Dependencies

```bash
pnpm install
```

### Build the Project

To build the project, run:

```bash
pnpm build
```

### Run a Worker Node (Example)

To run a worker node, you can use the following command:

```bash
pnpm worker:start
```

### Run a Manager Node (Example)

To spin up a manager node:

```
pnpm manager:start
```

This will start a manager node that listens for incoming tasks and assigns them to worker nodes.
Manager node express server will be available at `http://localhost:8889`.

### Deployment

#### Contract Deployment

To deploy the necessary programs, and get a local solana validator running, you can use the following command:

```
docker-compose -f docker-compose.solana.yml up -d
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Questions?

Open an issue or reach out at [team@effect.ai](mailto:team@effect.ai).
