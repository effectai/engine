<template>
  <div>
    <!-- Device Recovery Overlay -->
    <div
      v-if="showRecovery"
      style="position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;"
    >
      <div
        style="background: white; border-radius: 16px; padding: 24px; max-width: 420px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);"
      >
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Recover Your Wallet</h2>
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
          We found wallets already linked to this account. Pick the one whose wallet address
          matches the address you used before.
        </p>
        <div role="radiogroup" aria-label="Wallets" style="display: flex; flex-direction: column; gap: 8px;">
          <div
            v-for="device in devices"
            :key="device.modifier"
            role="radio"
            :aria-checked="selectedModifier === device.modifier"
            :style="{
              border: '1px solid',
              borderColor: selectedModifier === device.modifier ? '#111827' : '#e5e7eb',
              boxShadow: selectedModifier === device.modifier ? '0 0 0 1px #111827' : 'none',
              borderRadius: '12px',
              padding: '12px',
              cursor: 'pointer',
            }"
            @click="selectedModifier = device.modifier"
          >
            <span
              v-if="selectedModifier === device.modifier"
              style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: white; background: #111827; border-radius: 999px; padding: 2px 8px; margin-bottom: 8px;"
            >
              <UIcon name="lucide:check" class="h-3 w-3" />
              Selected
            </span>
            <p style="font-size: 12px; color: #888; margin-bottom: 2px;">Wallet address</p>
            <p style="font-size: 14px; font-weight: 600; font-family: ui-monospace, monospace; word-break: break-all; margin-bottom: 8px;">
              {{ device.address }}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <p style="font-size: 12px; color: #888;">
                Set up {{ formatDate(new Date(device.created)) }}
              </p>
              <button
                type="button"
                style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #888; background: transparent; border: none; cursor: pointer; padding: 0;"
                :aria-expanded="expandedDeviceInfo === device.modifier"
                @click.stop="toggleDeviceInfo(device.modifier)"
              >
                <UIcon name="lucide:info" class="h-4 w-4" />
                Device info
              </button>
            </div>
            <p
              v-if="expandedDeviceInfo === device.modifier"
              style="font-size: 12px; color: #666; background: #f9fafb; border-radius: 8px; padding: 8px; margin-top: 8px; word-break: break-word;"
            >
              {{ device.meta || "Unknown device" }}
            </p>
          </div>
        </div>
        <UButton
          v-if="selectedModifier"
          color="neutral"
          size="lg"
          block
          style="margin-top: 16px;"
          @click="resolveRecovery(selectedModifier)"
        >
          Recover Selected Wallet
        </UButton>
        <button
          style="margin-top: 16px; width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; background: transparent; font-size: 14px; cursor: pointer;"
          @click="resolveRecovery(null)"
        >
          Create New Wallet
        </button>
        <p style="font-size: 12px; color: #888; margin-top: 8px; text-align: center;">
          A new wallet gets a different address from the ones above.
        </p>
      </div>
    </div>

    <!-- Post-recovery connect box -->
    <div
      v-if="recoveredManagerP2pAddr"
      style="position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;"
    >
      <div
        style="background: white; border-radius: 16px; padding: 24px; max-width: 420px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);"
      >
        <div class="text-center space-y-2 mb-4">
          <h2 class="text-xl font-semibold">Wallet Recovered</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            We recovered your wallet. In order to sync your latest data, you will
            first need to connect to a manager.
          </p>
        </div>

        <UButton
          color="neutral"
          size="lg"
          block
          :loading="connecting"
          @click="handleRecoveryConnect()"
        >
          Connect to Manager
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { multiaddr } from "@effectai/protocol-core";
import { toString } from "uint8arrays";

const toast = useToast();
const {
  pendingRecoveryPrivateKey,
  loginWithPrivateKey,
  privateKey: privateKeyRef,
} = useAuth();
const { connectToManagerMutation } = useSession();
const { mutateAsync: connectToManager } = connectToManagerMutation;
const {
  showRecovery,
  devices,
  checkForRecovery,
  resolveRecovery,
} = useLoginRecovery();

const recoveredManagerP2pAddr = ref<string | null>(null);
const connecting = ref(false);
const selectedModifier = ref<string | null>(null);
const expandedDeviceInfo = ref<string | null>(null);

const toggleDeviceInfo = (modifier: string) => {
  expandedDeviceInfo.value =
    expandedDeviceInfo.value === modifier ? null : modifier;
};

// Watch for pending recovery from any login method
watch(
  () => pendingRecoveryPrivateKey.value,
  async (pk) => {
    if (!pk) return;
    const recovered = await checkForRecovery(pk);
    if (recovered) {
      localStorage.setItem("modifierHex", recovered.modifier);
      // UUIDs are no longer needed, so we don't recover them. Use an tempy
      // value for now until they are permantenly removed
      localStorage.setItem("modifier", "00000000-0000-0000-0000-000000000000");
      // Complete auth
      await loginWithPrivateKey(pk);
      // Initialize the worker
      const { initialize } = useWorkerStore();
      const pkBytes = Buffer.from(pk, "hex").slice(0, 32);
      await initialize(pkBytes);
      // Suppress OnboardModal
      localStorage.setItem("newUser", "false");
      // Show connect box
      recoveredManagerP2pAddr.value = recovered.managerP2pAddr;
    } else {
      // No recovery needed, generate random modifier and complete auth
      localStorage.setItem("modifier", crypto.randomUUID());
      await loginWithPrivateKey(pk);
      navigateTo("/");
    }
    pendingRecoveryPrivateKey.value = null;
  },
  { immediate: true },
);

const handleRecoveryConnect = async (code?: string) => {
  if (!recoveredManagerP2pAddr.value) return;
  connecting.value = true;
  try {
    await connectToManager({
      multiAddress: recoveredManagerP2pAddr.value,
      accessCode: undefined,
    });
    toast.add({
      title: "Connected to Manager Node",
      description: "Successfully synced your data.",
      color: "success",
    });
    navigateTo("/");
  } catch (error) {
    if (error instanceof Error) {
      toast.add({
        title: "Connection Error",
        description: error.message,
        color: "error",
      });
    }
  } finally {
    connecting.value = false;
  }
};
</script>

<style scoped></style>