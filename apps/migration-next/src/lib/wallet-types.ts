export type SourceChain = "EOS" | "BSC";

export type WalletConnectionMeta = {
  name: string;
  icon?: string;
  permission?: string;
  chain: "EOS" | "BSC" | "SOL";
};

export interface SourceWallet {
  address?: string | null;
  walletMeta?: WalletConnectionMeta | null;
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getNativeBalance(): Promise<{ value: number; symbol: string }>;
  getEfxBalance(): Promise<{ value: number; symbol: string }>;
  getForeignPublicKey(): Promise<Uint8Array>;
  authorizeTokenClaim(destSolanaAddress: string): Promise<{
    foreignPublicKey: Uint8Array;
    signature: Uint8Array;
    message: Uint8Array;
  }>;
}

export interface DestWallet {
  address?: string | null;
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  // add any Solana-specific helpers you need (send tx, sign msg, etc.)
}
