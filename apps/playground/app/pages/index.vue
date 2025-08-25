<template>
  <div>
    <UWalletList />
    <button @click="stake">stake</button>
  </div>
</template>

<script setup lang="ts">
import { getStakeInstructionAsync } from "@effectai/stake";
import {
  address,
  generateKeyPairSigner,
  type TransactionSendingSigner,
  type KeyPairSigner,
} from "@solana/kit";
import { connect } from "solana-kite";

const { address: walletAddress, signer } = useWallet();

const stake = async () => {
  const connection = connect("http://localhost:8899", "ws://localhost:8900");

  const userTokenAccount = await connection.getTokenAccountAddress(
    walletAddress.value,
    address("mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P"),
  );

  const stakeAccount = await generateKeyPairSigner();

  const stakeIx = await getStakeInstructionAsync({
    stakeAccount,
    duration: 30 * 24 * 60 * 60, // 30 days in seconds
    authority: signer.value as TransactionSendingSigner,
    userTokenAccount,
    mint: address("mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P"),
    amount: 1000,
  });

  const sig = await connection.sendTransactionFromInstructions({
    feePayer: signer.value as unknown as KeyPairSigner,
    instructions: [stakeIx],
    maximumClientSideRetries: 3,
  });

  console.log(`Transaction successful: ${sig}`);
  console.log(`Explorer link: ${connection.getExplorerLink("tx", sig)}`);
};
</script>

<style scoped></style>
