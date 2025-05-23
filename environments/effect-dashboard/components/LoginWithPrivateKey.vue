<template>
  <UCard class="w-full max-w-2xl mx-auto">
    <div class="">
      <div class="">
        <UButton
          class="p-0 py-2"
          variant="link"
          color="black"
          @click="emit('back')"
        >
          <UIcon name="lucide:arrow-left" />
          Back to Login
        </UButton>
      </div>
      <UDivider />

      <p class="my-3">
        <b>For users who value privacy or prefer not to use social logins:</b>
        You can connect to your worker node using a 12-word seed phrase. It's
        important to keep your seed phrase secure—losing it means losing access
        to your worker node and all associated data.
      </p>
      <UInput
        v-model="mnemonic"
        type="text"
        label="Seed Phrase"
        placeholder="Enter a 12 word seed phrase"
        class="mb-4"
      ></UInput>
      <p class="text-sm font-bold my-2">
        Note: before you press connect, make sure you've securely stored your
        seed phrase.
      </p>
      <div class="flex gap-2">
        <UButton color="black" variant="outline" @click="generateSeedPhrase"
          >Generate Random</UButton
        >
        <UButton
          @click="connect"
          variant="solid"
          color="black"
          :disabled="!isValid"
          >Connect</UButton
        >
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { sha512 } from "@noble/hashes/sha512";
import { Keypair } from "@solana/web3.js";

const mnemonic = ref("");

const { login } = useAuthStore();

const emit = defineEmits(["back"]);
const generateSeedPhrase = () => {
  mnemonic.value = generateMnemonic(128);
};

const isValid = computed(() => {
  return mnemonic.value.split(" ").length === 12;
});

const connect = async () => {
  const seed = await mnemonicToSeed(mnemonic.value);
  const ed25519privateKey = sha512(seed.slice(0, 32));
  const pk = Keypair.fromSeed(ed25519privateKey.slice(0, 32));
  await login(Buffer.from(pk.secretKey).toString("hex"));
};
</script>

<style scoped></style>
