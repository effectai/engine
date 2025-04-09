import express from 'express';
import { Connection, PublicKey } from "@solana/web3.js";

const app = express();
const port = process.env.PORT || 3000;
const HELIUS_RPC = "API_KEY_HERE";

const connection = new Connection(HELIUS_RPC, 'confirmed');

const TOKEN_MINT_ADDRESS = new PublicKey("EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const walletAddresses = [
  "nXwHwpf23pp1GVE9AXV3KJTN4orAqWGFgwHQT8E7qEx", // Staking Rewards 
  "H5MdjqtFBLtgRViSWGNXCURG3WDgBMcsJsUsgyTg9jVB" // 50M DAO treasury
];
const treasuryWallet = "6Rj9MEjd5hMC9Nqdwh614yRQhvg9JSN7GAPHEcMKxJ6P"

async function getTreasuryLocked() {
  const balance = (await getTokenBalance(treasuryWallet)).balance 
  const now = Math.floor(Date.now() / 1000);
  const vestingStart = Math.floor(new Date("2025-01-10T12:00:00Z").getTime() / 1000);
  const totalVestingTime = 4 * 365 * 24 * 60 * 60;
  const elapsedTime = now - vestingStart;
  var vested = balance * (elapsedTime / totalVestingTime);
  
  return ( balance - vested )
  
}

async function getTokenBalance(wallet: string) {
  try {
    const walletPublicKey = new PublicKey(wallet);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
      programId: TOKEN_PROGRAM_ID
    });

    const matchingAccount = tokenAccounts.value.find(({ account }) => {
      const parsed = account.data.parsed;
      return parsed.info.mint === TOKEN_MINT_ADDRESS.toBase58();
    });

    if (matchingAccount) {
      const balance = matchingAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
      return { wallet, balance };
    } else {
      return { wallet, balance: 0 };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

async function main() {

  const results = await Promise.all(walletAddresses.map(getTokenBalance));
  const tokenSupply = await connection.getTokenSupply(TOKEN_MINT_ADDRESS);
  var cirulatingSupply = Number(tokenSupply.value.uiAmountString)

  results.forEach(({ balance }) => {
    cirulatingSupply -= balance
  });

  cirulatingSupply -= await getTreasuryLocked()
  
  return(`${cirulatingSupply}`);
}

app.get('/', async (_req, res) => {
    const result = await main();
    res.send(result);
  });

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
