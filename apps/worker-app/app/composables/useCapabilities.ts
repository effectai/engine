import { availableCapabilities } from "../constants/capabilities";

type UserCapabilityAssignment = {
  id: string;
  awardedAt: Date;
};

export const useCapabilities = () => {
  const userCapabilityAssignmentMap = useLocalStorage<
    UserCapabilityAssignment[]
  >("user-capabilities", []);

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

  const userAvailableCapabilities = computed(() =>
    availableCapabilities.filter(
      (capability) =>
        !userCapabilityAssignmentMap.value.some(
          (assignment) => assignment.id === capability.id,
        ),
    ),
  );

  const userCapabilityCount = computed(() => userCapabilities.value.length);

  return {
    userCapabilities,
    userCapabilityAssignmentMap,
    userAvailableCapabilities,
    userCapabilityCount,
  };
};
