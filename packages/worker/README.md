# Worker Package
The Worker Package is responsible for managing the lifecycle of worker nodes in the Effect Tasks network, handling tasks such as joining the worker pool, authenticating on-chain, worker node discovery, and ensuring payment for completed work.

## Package Logic:

### Join the Worker Pool:
Workers have to authenticate via wallet address on-chain to join the worker pool.
After authentication, workers can initiate a transaction to join the pool, officially registering themselves as active participants in the network.
The worker can also perform a transaction to leave the pool at any time, failing to properly leave the pool will result in a penalty.

### Worker Discovery:
The package facilitates worker discovery, allowing manager nodes to find and assign tasks to available workers.
Workers announce their presence and availability for tasks, making them visible to manager nodes.

### Base Rate Payment in EFX:
Once part of the worker pool, the worker contract automatically calculates and pays out a base rate of EFX tokens to active workers.
Payments are based on predefined criteria like task completion, cognitive abilities, and uniqueness, ensuring fair compensation for each worker's contribution.
