<template>
  <UCard class="flex flex-col" v-if="publicKey">
    <div id="confetti-container" class="max-w-[50px] mx-auto w-full h-full">
      <ConfettiExplosion
        v-if="triggerConfetti"
        :particleCount="200"
        :force="0.3"
      />
    </div>

    <div class="flex flex-col gap-5">
      <div class="bg-white/5 p-6 rounded-xl border border-gray-800">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-gray-800 text-white rounded-lg flex">
            <UIcon name="lucide:wallet" class="" />
          </div>
          <div
            class="flex-grow flex justify-between flex-wrap space-y-1 space-x-1"
          >
            <div>
              <div class="flex items-center">
                <p class="text-sm text-gray-400">Total Staked</p>
              </div>
              <p v-if="isLoading" class="text-2xl font-bold">...</p>
              <p v-else class="text-2xl font-bold">
                {{ formatNumber(stakeAmount) || "0" }} EFFECT
              </p>
            </div>
            <div v-if="stakeAmount">
              <UTooltip
                :ui="{ width: 'max-w-md' }"
                text="Staked tokens in January 2025 get a 20% increased reward ratio"
              >
                <UBadge
                  style="border-radius: 0"
                  label="BOOSTED"
                  class="rainbow-border"
                  color="gray"
                >
                  <template #trailing>
                    <UIcon
                      name="i-heroicons-fire"
                      class="h-6 w-6 text-lg"
                      size="lg"
                    />
                  </template>
                </UBadge>
              </UTooltip>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-white/5 p-6 rounded-xl border border-gray-800">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-gray-800 rounded-lg text-white flex">
            <UIcon name="lucide:chart-spline" />
          </div>
          <div>
            <p class="text-sm text-gray-400">Stake Age Score</p>
            <p v-if="isLoading" class="text-2xl font-bold">...</p>
            <AnimatedNumber
              v-else
              easing="easeInOutCubic"
              :value="stakeAge"
              :format="formatNumber"
              class="text-2xl font-bold flex relative"
              >{{ stakeAge }}
            </AnimatedNumber>
          </div>
        </div>
      </div>
      <div class="bg-white/5 p-6 rounded-xl border border-gray-800">
        <h3 class="text-lg font-semibold mb-4">Staking Statistics</h3>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span class="text-gray-400">Your Stake</span
            ><span class="font-medium"
              >{{ formatNumber(stakeAmount) || 0 }} EFFECT</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Lock Period</span
            ><span class="font-medium">{{ unstakeDays || 0 }} Days</span>
          </div>
        </div>

        <h3 class="text-lg font-semibold mb-4 mt-4">Rewards</h3>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span class="text-gray-400">Expected APY</span
            ><span class="font-medium">{{ expectedApy }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Pending Rewards</span
            ><span class="font-medium"
              >{{ pendingRewards.toFixed(2) || 0 }} EFFECT</span
            >
          </div>

          <UButton
            :loading="isClaimingRewards"
            v-if="pendingRewards > 0"
            @click="handleSubmit"
            color="white"
            class="flex justify-center w-full"
          >
            Claim {{ pendingRewards.toFixed(2) }} EFFECT
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  import { BN } from "@coral-xyz/anchor";
  import { useWallet } from "solana-wallets-vue";
  import ConfettiExplosion from "vue-confetti-explosion";

  const { useGetStakeAccount } = useStakingProgram();

  const {
    useGetRewardAccount,
    useClaimRewards,
    useGetReflectionAccount,
    intermediaryReflectionVaultAccount,
  } = useRewardProgram();
  const { publicKey } = useWallet();

  /**
   * Stake age Logic
   */
  const {
    data: stakeAccount,
    isLoading,
    unstakeDays,
    amountFormatted: stakeAmount,
  } = useGetStakeAccount();

  const stakeAge = computed(() => {
    if (!stakeAccount.value?.account.stakeStartTime || !currentTime.value)
      return 0;
    return calculateStakeAge(
      stakeAccount.value.account.stakeStartTime.toNumber()
    );
  });

  const currentTime = ref(new Date().getTime() / 1000);
  onMounted(() => {
    const interval = setInterval(() => {
      currentTime.value = new Date().getTime() / 1000;
    }, 5000);

    onUnmounted(() => clearInterval(interval));
  });

  /**
   * Reward Logic
   */
  const { data: reflectionData } = useGetReflectionAccount();
  const reflectionAccount = computed(() => {
    if (!reflectionData.value) return null;
    return reflectionData.value.reflectionAccont;
  });
  const { data: rewardAccount } = useGetRewardAccount(stakeAccount);
  const { mutateAsync: claimRewards, isPending: isClaimingRewards } =
    useClaimRewards();

  const expectedApy = computed(() => {
    if (!rewardAccount.value || !reflectionAccount.value) return 0;

    return calculateApy({
      yourStake: rewardAccount.value.weightedAmount,
      totalStaked: reflectionAccount.value.totalWeightedAmount,
      totalRewards: 21_600_000,
    });
  });

  const { useGetTokenAccountBalanceQuery } = useSolanaWallet();
  const { useGetActiveRewardVestingAccount } = useVestingProgram();
  const { data: vestingRewardAccount } = useGetActiveRewardVestingAccount();
  const vestingVaultAccount = computed(() => {
    if (!vestingRewardAccount.value) return undefined;
    return vestingRewardAccount.value.vestingVaultAccount;
  });
  const { data: balance } = useGetTokenAccountBalanceQuery(vestingVaultAccount);
  const { data: intermediaryVaultBalance } = useGetTokenAccountBalanceQuery(
    ref(intermediaryReflectionVaultAccount)
  );

  const pendingRewards = computed(() => {
    if (!rewardAccount.value || !reflectionAccount.value) return 0;

    // calculate unclaimed rewards from the vesting account
    const amountDue =
      (vestingRewardAccount.value &&
        calculateDue(
          vestingRewardAccount.value.account.startTime.toNumber(),
          vestingRewardAccount.value.account.releaseRate.toNumber(),
          vestingRewardAccount.value.account.distributedTokens.toNumber(),
          balance.value?.value || 0
        )) ||
      0;

    return (
      calculatePendingRewards({
        reflection: rewardAccount.value.reflection,
        rate: reflectionAccount.value.rate,
        weightedAmount: rewardAccount.value.weightedAmount,
      }) +
      ((amountDue / 1e6) *
        rewardAccount.value.weightedAmount.div(new BN(1e6)).toNumber()) /
        reflectionAccount.value.totalWeightedAmount
          .div(new BN(1e6))
          .toNumber() +
      (intermediaryVaultBalance.value?.value || 0)
    );
  });

  const toast = useToast();
  const handleSubmit = async () => {
    try {
      if (!stakeAccount.value) {
        throw new Error("No stake account found");
      }

      if (!vestingRewardAccount.value) {
        throw new Error("No vesting reward account found");
      }

      await claimRewards({
        vestingRewardAccount: vestingRewardAccount.value,
        stakeAccount: stakeAccount.value,
      });

      toast.add({
        title: "Success",
        description: "Claimed rewards",
        color: "green",
      });
    } catch (e) {
      console.error(e);
      toast.add({
        title: "Error",
        description: "Something went wrong",
        color: "red",
      });
    }
  };

  const triggerConfetti = ref(false);
  // check if ?confetti=true is in the URL
  onMounted(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("confetti")) {
      triggerConfetti.value = true;
      // remove the query param from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
</script>

<style scoped>
  .rainbow-border {
    --angle: 0deg;
    border: 1px solid;
    border-radius: 0.375rem;
    border-image: conic-gradient(
        from var(--angle),
        red,
        yellow,
        lime,
        aqua,
        blue,
        magenta,
        red
      )
      1;
    background: none;
    animation: 10s rotate linear infinite;
  }

  @keyframes rotate {
    to {
      --angle: 360deg;
    }
  }

  @property --angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }
</style>
