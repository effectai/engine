# Effect AI P2P Tasking Infrastructure

Welcome to the Effect Tasking Mono Repo, this repository contains the neccesary packages for our tasking infrastructure to operate.

## Packages

| Package Name         | Description                                                                                                                 | Version | Notes |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| `@effectai/protocol` | Core Protocol module that defines the tasking infrastructure, shared utilities, and protocols for the Effect Tasks network. | 1.0.0   | -     |
| `@effectai/cli`      | CLI for managers and task providers to post encrypted tasks                                                                 | 1.0.0   | -     |
| `@effectai/zkp`      | ZKP Resources for batch verification of off-chain payments                                                                  | 1.0.0   | -     |
| `@effectai/shared`   | Shared resources like IDL's / utils etc.                                                                                    | 1.0.0   | -     |

# Installation

### Prerequisites

- Node.js >= 23.x
- pnpm >= 10.x

Most machines are good to go with just:

```
corepack enable pnpm
```

If that doesn't do the trick, [check out the installation guide](https://pnpm.io/installation) for other ways to get it set up.

### Clone the repository

Clone the repo and run:

`pnpm install`

## Quickstart

After installing dependencies, start by building the required packages:

```
pnpm packages:build
```

### Starting a Manager Node

To spin up a manager node:

```
pnpm manager:start
```

This will start a manager node that listens for incoming tasks and assigns them to worker nodes.
Manager node express server will be available at `http://localhost:8889`.

### Posting tasks

Before posting tasks, you need to register a task template. This can be done with the following command:

```

pnpm cli manager templates register --url <manager-url> --template-path <template-path>

```

This will return a template-id, which you can use to post tasks.

### Post a Basic task

You can post a basic task using the following command, most options will be set to default values:

```

pnpm cli manager tasks --url <manager-url> --template-id <template-id>

```

### Post a Task with Custom Values

You can also customize the task by specifying additional arguments:

```

pnpm cli manager tasks post --url <manager-url> --template-id <template-id> --title <task-title> --reward <task-reward> --data <task-data>

```

### Deploying contracts

In order for payouts to work, you need to run a local solana validator and deploy the payment contract

1. Install the [Solana CLI](https://solana.com/nl/docs/intro/installation)

2. Start a local validator

```

solana-test-validator

```

3. Build & Deploy the payment contract

First make sure that the account that deploys the contracts has some sol:

```

solana airdrop 20 authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV

```

Then run the following commands:

```

cd solana && \
anchor build && \
anchor deploy --provider.cluster localnet --program-name effect_payment

```

### Running the frontend

Now that you have a manager node running, you can run the frontend to interact with it.

```

cd environments/effect-dashboard && pnpm cp-env && pnpm dev

```
