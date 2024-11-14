<script setup lang="ts">
import { useAccount, useDisconnect, useSignMessage } from '@wagmi/vue';

const { address, connector } = useAccount();
const { disconnect } = useDisconnect();
const { signMessageAsync } = useSignMessage()

const signature = ref<string | null>(null);

const _signMessage = async () => {
  const message = 'Effect.AI: Sign this message to prove ownership of your address.';
  signature.value = await signMessageAsync({ message });
}

</script>

<template>
  <div>Address: {{ address }}</div>
  <div>Connected to {{ connector?.name }} Connector.</div>
  <button @click="disconnect()">Disconnect</button>
  <button @click="_signMessage">
    Sign message
  </button>
  <div v-if="signature">Signature: {{ signature }}</div>
</template>