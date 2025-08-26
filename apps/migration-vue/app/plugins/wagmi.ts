import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiPlugin } from "@wagmi/vue";

const projectId = "79d9a7fe570c471146ae1cbc2f6b05cf";

import { bsc, type AppKitNetwork } from "@reown/appkit/networks";
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(WagmiPlugin, { config: wagmiAdapter.wagmiConfig });
});
