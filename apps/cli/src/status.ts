import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS
} from '@solana-program/token';
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { createManager, generateKeyPairFromSeed } from "@effectai/protocol";
import { TOKEN_MINT } from "./helpers.js";
import { createWorkerEntity, type WorkerEntity } from "@effectai/protocol";

import { ping, Ping } from "@libp2p/ping"
import { multiaddr } from "@multiformats/multiaddr";

import {
  airdropFactory,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPair,
  getAddressFromPublicKey,
  type KeyPairSigner,
  lamports,
} from "@solana/kit";

export const statusProgram = new Command();

const MANAGER_MA = "/ip4/127.0.0.1/tcp/11995/ws/p2p/12D3KooWAQH4SQHt12N2eGnAUR4iixS8TAfKxRqfd17sDurZ1v5R";

statusProgram
  .name("status")
  .description("Network and identity status check.")
  .action(async (options, cmd) => {
  const opts = cmd.optsWithGlobals();

  console.log(`

 ░▒▓████████▓▒░ 
 ░▒▓█▓▒░        
 ░▒▓█▓▒░        
 ░▒▓██████▓▒░   
 ░▒▓█▓▒░        
 ░▒▓█▓▒░        
 ░▒▓████████▓▒░


Effect.AI
v1.0.1 `);
  
  let kp = opts.keypair;

  if (!kp) {
    console.error('error: required option --keypair not specified');
    process.exit(1);
  }
  const privateKey = readFileSync(opts.keypair, "utf-8");
  const secretKey = Uint8Array.from(JSON.parse(privateKey));
  const keypair = await generateKeyPairFromSeed(
    "Ed25519",
    secretKey.slice(0, 32),
  );
  const solkp = await createKeyPairSignerFromBytes(secretKey);

  const ipfsId = keypair.publicKey.toCID().toString();
  
  console.log(`
Account
-------
  Address: ${solkp.address.toString()}
  Age:     - Days`);

  const w = await createWorkerEntity({
    datastore: undefined,
    privateKey: keypair
  });
  let connection = "Established";
  let pingRes = -1;
  
  try {
    await w.node.start();
    const pingService = w.node.services.ping as Ping;
    pingRes = await pingService.ping(multiaddr(MANAGER_MA));
  } catch {
    connection = "Failed";
  }

  console.log(`
Network
-------
  P2P ID: ${w.getPeerId()}
  Connection: ${connection}
  Ping: ${pingRes}ms`);

  const rpc = createSolanaRpc(opts.solanaRpc);
  const solBal = (await rpc.getBalance(solkp.address).send()).value;
  const [nosAta] = await findAssociatedTokenPda({
    mint: TOKEN_MINT,
    owner: solkp.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  
  let nosBal = "0";
  try {
    nosBal = (await rpc.getTokenAccountBalance(nosAta).send()).value.amount;
  } catch {
  }

    console.log(`
Wallet
------
     ${Number(nosBal) / 1_000_000} EFFECT
     ${Number(solBal) / 1_000_000_000} SOLANA
`)

  await w.node.stop();

  console.log(`
Done ☀️
`);
});

