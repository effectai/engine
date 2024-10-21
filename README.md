# Effect Tasking Network Mono Repo

Welcome to the Effect Tasking Mono Repo, this repository contains the neccesary packages for our tasking infrastructure to operate.

## Packages

| Package Name     | Description                                 | Version | Notes                      |
|------------------|---------------------------------------------|---------|----------------------------|
| `@effectai/worker`| libp2p worker node implementation for the browser | 1.0.0   | -        |
| `@effectai/manager`| libp2p manager node implementation for nodejs   | 1.0.0   | -         |


# Installation

### Prerequisites
Most machines are good to go with just:

```
corepack enable pnpm
```
If that doesn't do the trick, [check out the installation guide](https://pnpm.io/installation) for other ways to get it set up.

## Scripts

Clone and run:

```pnpm install```


to run tests:

```pnpm vitest```