import {
  defineNuxtModule,
  createResolver,
  addPlugin,
  addComponentsDir,
  addImportsDir,
  installModule,
  addImports,
} from "@nuxt/kit";

export interface WalletModuleOptions {
  endpoint?: string;
  commitment?: "processed" | "confirmed" | "finalized";
  autoConnect?: boolean;
  persist?: boolean;
}

export default defineNuxtModule<WalletModuleOptions>({
  meta: { name: "@effectai/wallets-vue", configKey: "walletsVue" },
  defaults: {
    endpoint: "https://api.mainnet-beta.solana.com",
    commitment: "confirmed",
    autoConnect: true,
    persist: true,
  },
  async setup(options: WalletModuleOptions, _nuxt) {
    const resolver = createResolver(import.meta.url);
    // We can inject our CSS file which includes Tailwind's directives
    _nuxt.options.css.push(resolver.resolve("./runtime/assets/style.css"));
    //
    // await installModule("@nuxtjs/tailwindcss", {
    //   exposeConfig: true,
    //   config: {
    //     darkMode: "class",
    //     content: {
    //       files: [
    //         resolver.resolve("./runtime/components/**/*.{vue,mjs,ts}"),
    //         resolver.resolve("./runtime/*.{mjs,js,ts}"),
    //       ],
    //     },
    //   },
    // });
    //
    _nuxt.options.runtimeConfig.public.solanaWallet = options;
    addPlugin({
      src: resolver.resolve("./runtime/plugin.client"),
      mode: "client",
    });
    addPlugin({
      src: resolver.resolve("./runtime/plugin.server"),
      mode: "server",
    });

    addImports({
      name: "useWallet",
      as: "useWallet",
      from: resolver.resolve("runtime/composables/useWallet"),
    });

    addComponentsDir({
      global: true,
      path: resolver.resolve("./runtime/components"),
      prefix: "U",
      pathPrefix: false,
    });
  },
});
