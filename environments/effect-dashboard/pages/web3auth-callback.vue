<template>
  <div></div>
</template>

<script setup lang="ts">
const { web3Auth, init, privateKey, userInfo, isAuthenticated } = useAuth();

definePageMeta({
  layout: "worker",
});

onMounted(async () => {
  await init();
  if (web3Auth.value?.status === "connected") {
    const pk = await web3Auth.value.provider?.request({
      method: "solanaPrivateKey",
    });

    if (!pk) {
      console.error("No private key found");
    }

    privateKey.value = pk as string;

    userInfo.value = await web3Auth.value?.getUserInfo().then((user) => ({
      username: user.email || user.name || "Web3Auth User",
      profileImage:
        user.profileImage ||
        "https://avatars.dicebear.com/api/identicon/default.svg",
    }));

    isAuthenticated.value = true;

    localStorage.setItem("authMethod", "web3auth");
    localStorage.setItem("userInfo", JSON.stringify(userInfo.value));
    //redirect to /worker
    navigateTo("/worker");
  } else {
    console.error("Web3Auth is not connected");
  }
});
</script>

<style scoped></style>
