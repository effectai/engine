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
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Recover Device</h2>
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
          We found existing devices for your account. Choose one to recover or create a new device.
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div
            v-for="device in devices"
            :key="device.modifier"
            style="display: flex; align-items: center; gap: 12px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; cursor: pointer;"
            @click="resolveRecovery(device.modifier)"
          >
            <div>
              <p style="font-size: 14px; font-weight: 500;">{{ device.meta || "Unknown device" }}</p>
              <p style="font-size: 12px; color: #888;">{{ device.address.slice(0, 5) }}...{{ device.address.slice(-5) }} · {{ new Date(device.created).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>
        <button
          style="margin-top: 16px; width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; background: transparent; font-size: 14px; cursor: pointer;"
          @click="resolveRecovery(null)"
        >
          Create New Device
        </button>
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
          <h2 class="text-xl font-semibold">Device Recovered</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            We recovered your device. In order to sync your latest data, you will
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

// Watch for pending recovery from any login method
watch(
  () => pendingRecoveryPrivateKey.value,
  async (pk) => {
    if (!pk) return;
    const recovered = await checkForRecovery(pk);
    if (recovered) {
      localStorage.setItem("modifier", recovered.modifier);
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
      const randomBytes = crypto.getRandomValues(new Uint8Array(4));
      localStorage.setItem("modifier", Buffer.from(randomBytes).toString("hex"));
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