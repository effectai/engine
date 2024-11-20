// plugins/wagmi.js
import { WagmiPlugin } from '@wagmi/vue'
import { http, createConfig } from '@wagmi/vue'
import { bsc, mainnet, sepolia } from '@wagmi/vue/chains'
import { injected, metaMask, safe, walletConnect } from '@wagmi/vue/connectors'

export const config = createConfig({
  chains: [bsc],
  connectors: [
    injected(),
    metaMask()
  ],
  transports: {
    [bsc.id]: http(),
  },
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(WagmiPlugin, { config })
})