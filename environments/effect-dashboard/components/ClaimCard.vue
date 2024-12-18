<template>
    <UCard>
        {{ balance?.value.uiAmount }} EFFECT
    </UCard>
</template>

<script setup lang="ts">
import { useDeriveMigrationAccounts } from '@effectai/utils';
import { PublicKey } from '@solana/web3.js';

const { migrationProgram, useGetMigrationVaultBalance } = useMigrationProgram();

const props = defineProps<{
    migrationAccount: MigrationClaimAccount['account']
}>()

const config = useRuntimeConfig();
const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT as string);

const { migrationAccount, vaultAccount } = useDeriveMigrationAccounts({
    mint,
    foreignPublicKey: props.migrationAccount.foreignPublicKey,
    programId: migrationProgram.programId,
})

const { data: balance } = useGetMigrationVaultBalance(props.migrationAccount)

</script>

<style scoped></style>