# @wharfkit/wallet-plugin-anchor

A Session Kit wallet plugin for the [Anchor](https://www.greymass.com/anchor) wallet.

## Usage

Include this wallet plugin while initializing the SessionKit.

**NOTE**: This wallet plugin will only work with the SessionKit and requires a browser-based environment.

```ts
import {WalletPluginAnchor} from '@wharfkit/wallet-plugin-anchor'

const kit = new SessionKit({
    // ... your other options
    walletPlugins: [new WalletPluginAnchor()],
})
```

Custom buoy url and websocket class are supported.

```ts
import WebSocket from 'isomorphic-ws'
import {WalletPluginAnchor} from '@wharfkit/wallet-plugin-anchor'

const kit = new SessionKit({
    // ... your other options
    walletPlugins: [
        new WalletPluginAnchor({
            buoyUrl: 'https://cb.anchor.link',
            buoyWs: Websocket,
        }),
    ],
})
```

## Developing

You need [Make](https://www.gnu.org/software/make/), [node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/docs/install) installed.

Clone the repository and run `make` to checkout all dependencies and build the project. See the [Makefile](./Makefile) for other useful targets. Before submitting a pull request make sure to run `make lint`.

---

Made with ☕️ & ❤️ by [Greymass](https://greymass.com), if you find this useful please consider [supporting us](https://greymass.com/support-us).
