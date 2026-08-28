// 10 minutes, in seconds. Same duration as core/protocol/src/consts.ts

//TODO: This should be a shared constant between the manager and the protocol, 
// but we can't import from protocol-core in this file because it would 
// create a circular dependency. We should refactor this to avoid the 
// circular dependency.
export const TASK_ACCEPTANCE_TIME = 60 * 10;
export const ACTIVE_TASK_TRESHOLD = 50;
export const PAYMENT_BATCH_SIZE = 60;
export const PAYMENT_VERSION = 1;
