<script setup lang="ts">
  import { useConnect, useChainId, useAccount } from "@wagmi/vue";

  import { createAppKit } from "@reown/appkit/vue";
  import { bsc, type AppKitNetwork } from "@reown/appkit/networks";
  import { wagmiAdapter } from "./../plugins/wagmi";

  const projectId = "79d9a7fe570c471146ae1cbc2f6b05cf";

  const metadata = {
    name: "Effect AI",
    description: "Effect AI Dashboard",
    url: "https://dashboard.effect.ai", // origin must match your domain & subdomain
    icons: [""],
  };

  const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc];

  const modal = createAppKit({
    features: {
      email: false,
      socials: false,
    },
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata,
  });
</script>

<template>
  <UButton @click="modal.open()" color="black">
    <span class="w-4">
      <img src="@/assets/img/bsc.svg" alt="bsc" />
    </span>
    BSC Account
  </UButton>
</template>
