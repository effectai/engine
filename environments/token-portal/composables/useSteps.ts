import { useWallet } from "solana-wallets-vue"

const currentStep = ref(1)

export const useSteps = () => {

    const { signature, txHash } = useClaim() 
    const { publicKey } = useWallet()

    const steps = ref([
        { id: 'Step 1', name: 'Connect Solana wallet', href: '#', completed: computed(() => !!publicKey.value) },
        { id: 'Step 3', name: 'Prove ownership', href: '#', completed: computed(() => !!signature.value)  },
        { id: 'Step 3', name: 'Claim tokens', href: '#', status: 'upcoming', completed: computed(() => !!txHash.value) },
    ])

    return {
        currentStep,
        steps,
    }
}