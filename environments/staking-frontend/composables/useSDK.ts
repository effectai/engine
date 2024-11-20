import { Client, type ClientConfig } from '@nosana/sdk';
import { useAnchorWallet, type AnchorWallet, useWallet } from "solana-wallets-vue";
const config = useRuntimeConfig()
let wallet: Ref<AnchorWallet | undefined>;

const prioFee = useLocalStorage('prio-fee', 10000);

const nosana = computed(() => {
  const { publicKey } = useWallet();
  // TODO: publicKey.value needed to trigger change in creating SDK on reconnect
  console.log('publicKey', publicKey.value);
  try {
    wallet = useAnchorWallet();
  } catch (error) {}

  const clientConfig: Partial<ClientConfig> = {
    solana: {
      network: config.public.rpcUrl,
      priority_fee: prioFee.value
    },
  };

  return new Client(config.public.network, wallet ? wallet.value : undefined, clientConfig);
});

export const useSDK = () => {
  return { nosana, prioFee };
};
