import { availableCapabilities } from "../constants/capabilities";

type UserCapabilityAssignment = {
  id: string;
  awardedAt: Date;
};

type TestAttempt = {
  capabilityId: string;
  attempts: number;
  lastAttemptDate: Date;
  passed: boolean;
};

export const useCapabilities = () => {
  const workerStore = useWorkerStore();
  const { peerId } = storeToRefs(workerStore);

  if (!peerId.value) throw new Error("Peer ID is not available");

  const DEFAULT_MAX_ATTEMPTS = 3;

  const getCapabilityMaxAttempts = (capabilityId: string): number => {
    const capability = availableCapabilities.find((c) => c.id === capabilityId);
    return capability?.attempts ?? DEFAULT_MAX_ATTEMPTS;
  };

  const awardCapability = (capabilityId: string) => {
    if (
      userCapabilityAssignmentMap.value.some(
        (assignment) => assignment.id === capabilityId,
      )
    ) {
      console.warn(`Capability ${capabilityId} already awarded.`);
      return;
    }

    userCapabilityAssignmentMap.value.push({
      id: capabilityId,
      awardedAt: new Date(),
    });
  };

  const userCapabilityAssignmentMap = useLocalStorage<
    UserCapabilityAssignment[]
  >(`${peerId.value?.toString()}-capabilities`, []);

  const testAttempts = useLocalStorage<TestAttempt[]>(
    `${peerId.value?.toString()}-test-attempts`,
    []
  );

  const userCapabilities = computed(() =>
    availableCapabilities
      .filter((capability) =>
        userCapabilityAssignmentMap.value.some(
          (assignment) => assignment.id === capability.id,
        ),
      )
      .map((capability) => ({
        ...capability,
        awardedAt: userCapabilityAssignmentMap.value.find(
          (assignment) => assignment.id === capability.id,
        )?.awardedAt,
      })),
  );

  const userCapabilityAssignmentIds = computed(() =>
    userCapabilityAssignmentMap.value.map((assignment) => assignment.id),
  );

  const userAvailableCapabilities = computed(() =>
    availableCapabilities.filter(
      (capability) =>
        !capability.hidden &&
        !userCapabilityAssignmentMap.value.some(
          (assignment) => assignment.id === capability.id,
        ) &&
        // Check if prerequisite is met (if one exists)
        (!capability.prerequisite ||
          userCapabilityAssignmentMap.value.some(
            (assignment) => assignment.id === capability.prerequisite,
          )),
    ),
  );

  const userCapabilityCount = computed(() => userCapabilities.value.length);

  const clearUserCapabilities = () => {
    userCapabilityAssignmentMap.value = [];
  };

  const incrementTestAttempt = (capabilityId: string, passed: boolean) => {
    const existing = testAttempts.value.find(
      (t) => t.capabilityId === capabilityId
    );
    if (existing) {
      existing.attempts++;
      existing.lastAttemptDate = new Date();
      existing.passed = existing.passed || passed;
    } else {
      testAttempts.value.push({
        capabilityId,
        attempts: 1,
        lastAttemptDate: new Date(),
        passed,
      });
    }
  };

  const getRemainingAttempts = (
    capabilityId: string,
    maxAttempts?: number
  ) => {
    const max = maxAttempts ?? getCapabilityMaxAttempts(capabilityId);
    const attempt = testAttempts.value.find(
      (t) => t.capabilityId === capabilityId
    );
    if (!attempt) return max;
    if (attempt.passed) return 0; // Already passed, no more attempts needed
    return Math.max(0, max - attempt.attempts);
  };

  const hasAttemptsRemaining = (
    capabilityId: string,
    maxAttempts?: number
  ) => {
    return getRemainingAttempts(capabilityId, maxAttempts) > 0;
  };

  return {
    userCapabilities,
    userCapabilityAssignmentMap,
    userAvailableCapabilities,
    userCapabilityCount,
    userCapabilityAssignmentIds,
    clearUserCapabilities,
    availableCapabilities,
    awardCapability,
    incrementTestAttempt,
    getRemainingAttempts,
    hasAttemptsRemaining,
    getCapabilityMaxAttempts,
  };
};
