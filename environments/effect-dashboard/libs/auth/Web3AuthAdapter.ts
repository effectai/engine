import type { Web3AuthNoModal } from "@web3auth/no-modal";
import type { AuthAdapter } from "./AuthAdapter";
import { CHAIN_NAMESPACES, UX_MODE } from "@web3auth/base";
import { SOLANA_CHAIN_IDS } from "@web3auth/ws-embed";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { AuthAdapter as Web3Adapter } from "@web3auth/auth-adapter";

const clientId =
  "BIcF8x3jW7FR6hqAedtD8s0sjsyCsGSRk_sLnuCdDThbaYyk7op5q8J_F3ywacftuWmzHrL39PFZjYocu5vHQMU";

export const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: SOLANA_CHAIN_IDS.SOLANA_MAINNET, // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
  rpcTarget: "https://marni-l6uvpy-fast-mainnet.helius-rpc.com",
  displayName: "Solana Mainnet",
  blockExplorerUrl: "https://explorer.solana.com",
  ticker: "SOL",
  tickerName: "Solana",
  decimals: 9,
  logo: "https://images.toruswallet.io/solana.svg",
};

export const web3AuthOptions = {
  clientId,
  web3AuthNetwork: "sapphire_devnet",
  chainConfig,
};

export class Web3AuthAdapter implements AuthAdapter {
  provider: SolanaPrivateKeyProvider | null = null;
  adapter: Web3Adapter | null = null;

  async init() {
    this.provider = new SolanaPrivateKeyProvider({
      config: { chainConfig },
    });

    this.adapter = new Web3Adapter({
      privateKeyProvider: this.provider,
      adapterSettings: {
        uxMode: UX_MODE.REDIRECT,
      },
    });
  }

  constructor(private web3authInstance: Web3AuthNoModal) {
    this.init();
  }

  async getUserName() {
    const userInfo = await this.web3authInstance.getUserInfo();
    return userInfo.name || userInfo.email || "Web3 User";
  }

  async getPrivateKey() {
    if (!this.web3authInstance.provider) {
      throw new Error("Web3Auth provider is not initialized");
    }

    return this.web3authInstance.provider.request({
      method: "solanaPrivateKey",
    }) as Promise<string>;
  }

  isAuthenticated() {
    return !!this.web3authInstance.provider;
  }
}
