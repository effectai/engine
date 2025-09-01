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

## 📁 Repository Structure

This monorepo is organized into the following main directories:

### 🏗️ Core Infrastructure

| Directory | Description |
| --------- | ----------- |
| **[`core/protocol/`](./core/protocol)** | Core protocol implementation (`@effectai/protocol-core`) - tasking infrastructure and shared utilities |
| **[`core/protobufs/`](./core/protobufs)** | Protocol buffer definitions (`@effectai/protobufs`) for cross-platform communication |
| **[`core/program/`](./core/program)** | Solana smart contracts and on-chain program logic |

### 🔧 Modules

| Directory | Description |
| --------- | ----------- |
| **[`modules/manager/`](./modules/manager)** | Manager node implementation (`@effectai/manager`) - orchestrates task distribution |
| **[`modules/worker/`](./modules/worker)** | Worker node implementation (`@effectai/worker`) - executes assigned tasks |
| **[`modules/payment/`](./modules/payment)** | Payment processing module (`@effectai/payment`) |
| **[`modules/reward/`](./modules/reward)** | Reward distribution system (`@effectai/reward`) |
| **[`modules/stake/`](./modules/stake)** | Staking mechanism implementation (`@effectai/stake`) |
| **[`modules/vesting/`](./modules/vesting)** | Token vesting functionality (`@effectai/vesting`) |
| **[`modules/migration/`](./modules/migration)** | Data migration utilities (`@effectai/migration`) |

### 📦 Packages

| Directory | Description |
| --------- | ----------- |
| **[`packages/library/`](./packages/library)** | Core protocol library (`@effectai/protocol`) - main API package |
| **[`packages/utils/`](./packages/utils)** | Shared utilities (`@effectai/utils`) |
| **[`packages/solana-utils/`](./packages/solana-utils)** | Solana-specific utilities (`@effectai/solana-utils`) |
| **[`packages/test-utils/`](./packages/test-utils)** | Testing utilities (`@effectai/test-utils`) |
| **[`packages/ui/`](./packages/ui)** | Shared UI components (`@effectai/ui`) |
| **[`packages/config/`](./packages/config)** | Configuration management (`@effectai/config`) |
| **[`packages/wallets-vue/`](./packages/wallets-vue)** | Vue.js wallet integration (`@effectai/wallets-vue`) |

### 🌐 Applications

| Directory | Description |
| --------- | ----------- |
| **[`apps/portal/`](./apps/portal)** | Main Effect portal web application |
| **[`apps/website/`](./apps/website)** | Marketing and information website |
| **[`apps/docs/`](./apps/docs)** | Documentation site |
| **[`apps/staking-app/`](./apps/staking-app)** | Staking interface application |
| **[`apps/migration-app/`](./apps/migration-app)** | Token migration interface |
| **[`apps/task-poster/`](./apps/task-poster)** | Task creation and posting interface |
| **[`apps/playground/`](./apps/playground)** | Development playground and testing environment |

### 🛠️ Tools & Services

| Directory | Description |
| --------- | ----------- |
| **[`tools/cli/`](./tools/cli)** | Command-line interface (`@effectai/cli`) for network interaction |
| **[`tools/docker/`](./tools/docker)** | Docker configurations and deployment scripts |
| **[`tools/scripts/`](./tools/scripts)** | Development and deployment scripts |
| **[`tools/keys/`](./tools/keys)** | Key management utilities |
| **[`tools/guix/`](./tools/guix)** | Guix package definitions |
| **[`services/cmc-endpoint/`](./services/cmc-endpoint)** | CoinMarketCap API endpoint service |
| **[`idls/`](./idls)** | Interface Definition Language files for Solana contracts |
| **[`assets/templates/`](./assets/templates)** | Task templates and predefined schemas |

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

### Run a Manager Node (Example)

To spin up a manager node:

```bash
pnpm manager:start
```

Alternatively, you can use the CLI directly:

```bash
pnpm cli manager run --help
```

### Run a Worker Node (Example)

Workers can be run programmatically using the worker module. See the [`modules/worker/`](./modules/worker) documentation for detailed setup instructions.

**Note:** When running a manager node, it will listen for incoming tasks and assign them to worker nodes. The manager node express server will be available at `http://localhost:8889`.

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
