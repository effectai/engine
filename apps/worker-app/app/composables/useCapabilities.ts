import { availableCapabilities } from "../constants/capabilities";

type UserCapabilityAssignment = {
  id: string;
  awardedAt: Date;
};

export const useCapabilities = () => {
  const { peerId } = useWorkerNode();

  if (!peerId.value) throw new Error("Peer ID is not available");

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
        !userCapabilityAssignmentMap.value.some(
          (assignment) => assignment.id === capability.id,
        ),
    ),
  );

  const userCapabilityCount = computed(() => userCapabilities.value.length);

  const clearUserCapabilities = () => {
    userCapabilityAssignmentMap.value = [];
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
  };
};
