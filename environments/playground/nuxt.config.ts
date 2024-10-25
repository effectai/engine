import { createRelayServer } from "@effectai/task-relay";
import { nodePolyfills } from "vite-plugin-node-polyfills";

let test = '';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

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
      test
    }
  },

  vite: {
    plugins: [
      nodePolyfills()
    ]
  },

  modules: ["@nuxt/ui"]
})