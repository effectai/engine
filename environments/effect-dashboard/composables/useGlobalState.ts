import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";

export const signature = ref<Uint8Array | null>(null);
export const message = ref<Uint8Array | null>(null);
export const foreignPublicKey = ref<Uint8Array | null>(null);
export const connection = new Connection('http://localhost:8899', 'confirmed');

export const useGlobalState = () => {
    const config = useRuntimeConfig();

    if(!config.public.EFFECT_SPL_TOKEN_MINT){
        throw new Error('EFFECT_SPL_TOKEN_MINT not set. Please set it in your .env file');
    }
    
    if(!config.public.EFFECT_VAULT_INITIALIZER){
        throw new Error('EFFECT_VAULT_INITIALIZER not set. Please set it in your .env file');
    }

    const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT);
    
    const {publicKey} = useWallet();

    const clear = () => {
        signature.value = null;
        message.value = null;
        foreignPublicKey.value = null;
    };

    const set = (sig: Uint8Array, msg: Uint8Array, pk: Uint8Array) => {
        signature.value = sig;
        message.value = msg;
        foreignPublicKey.value = pk;
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