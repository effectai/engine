import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";

export const signature = ref<Uint8Array | null>(null);
export const message = ref<Uint8Array | null>(null);
export const foreignPublicKey = ref<Uint8Array | null>(null);

const config = useRuntimeConfig();
const rpcUrl = config.public.EFFECT_SOLANA_RPC_NODE_URL;
export const connection = new Connection(rpcUrl, 'confirmed');

export const publicKeyString = ref<string | null>(null);

export const useGlobalState = () => {
    const config = useRuntimeConfig();

    if(!config.public.EFFECT_SPL_TOKEN_MINT){
        throw new Error('EFFECT_SPL_TOKEN_MINT not set. Please set it in your .env file');
    }
    
    const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT);
    
    const { publicKey } = useWallet();

    const clear = () => {
        signature.value = null;
        message.value = null;
        foreignPublicKey.value = null;
    };

    const set = (sig: Uint8Array, msg: Uint8Array, pk: Uint8Array, pkString: string) => {
        signature.value = sig;
        message.value = msg;
        foreignPublicKey.value = pk;
        publicKeyString.value = pkString;
    };

    const canClaim = computed(() => {
		return signature.value && message.value && publicKey.value;
	});


    return {
        signature,
        message,
        foreignPublicKey,

        // methods
        clear,
        set,

        // state computeds
        canClaim,

        connection,
        mint
    };
}