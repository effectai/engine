# Effect Network repository context

## Purpose and scope
- Rust workspace exploring the Effect Network stack for decentralized task marketplaces.
- Provides a manager node that orchestrates task lifecycles, a worker node that connects over libp2p, and supporting libraries for workflows, storage, and application definitions.

## Key crates
- `manager-node`: libp2p-based coordinator exposing `/effect/task-ctrl/1` and `/effect/application-ctrl/1` request/response protocols. Handles application registration, task submission, worker connections, and job sequencing with persistent state in sled.
- `worker-node`: CLI worker that dials a manager, accepts tasks, and streams task status updates. Currently stubbed to auto-complete tasks for demo purposes.
- `workflow`: generic state machine engine powering task lifecycle (Created → Assign → InProgress → Completed) with delegation strategies, timers, and event logging.
- `application`: models multi-step applications, builders for templates/capabilities, and glue to workflow delegation policies.
- `storage`: sled-backed persistence layer for active/completed tasks, application metadata, and multi-step job sequences.
- `proto`: quick-protobuf definitions for application control, task control, and shared acknowledgements.
- `codec`: request/response codec wrappers pairing the protobuf messages with libp2p.
- `manager-node::sequencer`: sequences multi-step application jobs, resuming in-progress steps and notifying orchestrator when steps complete.
- `zkp-layer`: BN254/Groth16 proving primitives for manager-signed task receipts, including Poseidon-based nullifier hashing, sparse indexed Merkle tree utilities, receipt packing/signing helpers, and a CLI to generate proving/verifying keys for batch insert circuits.

## Architectural flow
- Providers register applications (with templated steps and delegation strategies) via the manager; definitions are persisted and exposed over the application control protocol.
- Task submissions instantiate workflow-driven task instances; the task orchestrator tracks assignments, worker connectivity, and broadcasts messages.
- Workers connect over libp2p, receive `TaskPayload` messages, acknowledge, and post `TaskMessage` updates that drive workflow transitions (accept/completed/timeouts).
- The sequencer manages multi-step jobs, ensuring subsequent steps start once the previous task completes and merging step results into job context.
- Storage maintains crash-safe state; on startup the manager reconciles persisted tasks/jobs and resumes workflows.
