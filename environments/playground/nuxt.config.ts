import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr:false,
  hooks: {
    listen(server, { host, port }) {
      // start relay server and pass the server instance to the client
      // console.log("test", test);

      // set the state
      // useState(() => {
      //   createRelayServer().then((relay) => {
      //     console.log("Relay server listening on:", relay.getMultiaddrs());
      //     server.$relay = relay;
      //   });
      // })
    }
  },
  runtimeConfig: {
    public: {
      BOOTSTRAP_NODE: process.env.BOOTSTRAP_NODE || [],
    }
  },
  vite: {
    plugins: [
      nodePolyfills()
    ]
  },

  modules: ["@nuxt/ui"]
})