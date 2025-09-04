<script lang="ts">
import { computed, defineComponent, ref, toRefs } from "vue";
import { onClickOutside, useClipboard } from "@vueuse/core";
import { useWallet } from "./../composables/useWallet";
import WalletConnectButton from "./ConnectButton.vue";
import WalletIcon from "./WalletIcon.vue";
import WalletModalProvider from "./WalletModal.vue";

export default defineComponent({
  components: {
    WalletConnectButton,
    WalletIcon,
    WalletModalProvider,
  },
  props: {
    featured: { type: Number, default: 3 },
    container: { type: String, default: "body" },
    logo: String,
    dark: Boolean,
  },
  setup(props) {
    const { featured, container, logo, dark } = toRefs(props);
    const {
      address: publicKey,
      wallet,
      disconnect,
      formatAddress,
    } = useWallet();

    const dropdownPanel = ref<HTMLElement>();
    const dropdownOpened = ref(false);
    const openDropdown = () => {
      dropdownOpened.value = true;
    };
    const closeDropdown = () => {
      dropdownOpened.value = false;
    };
    onClickOutside(dropdownPanel, closeDropdown);

    const publicKeyTrimmed = computed(() => {
      return publicKey.value ? formatAddress(4) : "";
    });

    const {
      copy,
      copied: addressCopied,
      isSupported: canCopy,
    } = useClipboard();
    const copyAddress = () => publicKey.value && copy(publicKey.value);

    // Define the bindings given to scoped slots.
    const scope = {
      featured,
      container,
      logo,
      dark,
      wallet,
      publicKey,
      publicKeyTrimmed,
      canCopy,
      addressCopied,
      dropdownPanel,
      dropdownOpened,
      openDropdown,
      closeDropdown,
      copyAddress,
      disconnect,
    };

    return {
      scope,
      ...scope,
    };
  },
});
</script>

<template>
  <wallet-modal-provider
    :featured="featured"
    :container="container"
    :logo="logo"
    :dark="dark"
  >
    <template #default="modalScope">
      <slot v-bind="{ ...modalScope, ...scope }">
        <button
          v-if="!wallet"
          class="swv-button swv-button-trigger"
          @click="modalScope.openModal"
        >
          <slot name="select-wallet-content">Select Wallet</slot>
        </button>
        <wallet-connect-button v-else-if="!publicKey"></wallet-connect-button>
        <div v-else class="swv-dropdown">
          <slot name="dropdown-button" v-bind="{ ...modalScope, ...scope }">
            <button
              class="swv-button swv-button-trigger"
              :style="{ pointerEvents: dropdownOpened ? 'none' : 'auto' }"
              :aria-expanded="dropdownOpened"
              :title="publicKey"
              @click="openDropdown"
            >
              <wallet-icon :wallet="wallet"></wallet-icon>
              <p v-text="publicKeyTrimmed"></p>
            </button>
          </slot>
          <slot name="dropdown" v-bind="{ ...modalScope, ...scope }">
            <ul
              aria-label="dropdown-list"
              class="swv-dropdown-list"
              :class="{ 'swv-dropdown-list-active': dropdownOpened }"
              ref="dropdownPanel"
              role="menu"
            >
              <slot name="dropdown-list" v-bind="{ ...modalScope, ...scope }">
                <li
                  v-if="canCopy"
                  @click="copyAddress"
                  class="swv-dropdown-list-item"
                  role="menuitem"
                >
                  {{ addressCopied ? "Copied" : "Copy address" }}
                </li>
                <li
                  @click="
                    modalScope.openModal();
                    closeDropdown();
                  "
                  class="swv-dropdown-list-item"
                  role="menuitem"
                >
                  Change wallet
                </li>
                <li
                  @click="
                    disconnect();
                    closeDropdown();
                  "
                  class="swv-dropdown-list-item"
                  role="menuitem"
                >
                  Disconnect
                </li>
              </slot>
            </ul>
          </slot>
        </div>
      </slot>
    </template>

    <!-- Enable modal overrides. -->
    <template #overlay="modalScope">
      <slot name="modal-overlay" v-bind="{ ...modalScope, ...scope }"></slot>
    </template>
    <template #modal="modalScope">
      <slot name="modal" v-bind="{ ...modalScope, ...scope }"></slot>
    </template>
  </wallet-modal-provider>
</template>
