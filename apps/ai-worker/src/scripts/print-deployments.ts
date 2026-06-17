import { loadWorkerConfig } from "../config.js";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import {
  createNosanaClient,
  NosanaNetwork,
  type DeploymentsApi,
} from "@nosana/kit";

const DEFAULT_API_BACKEND_URL = "https://dashboard.k8s.prd.nos.ci";

const { privateKey } = loadWorkerConfig();

const wallet = await createKeyPairSignerFromBytes(privateKey);

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  wallet,
  api: { backend_url: DEFAULT_API_BACKEND_URL },
});

const deployments = client.api.deployments as DeploymentsApi;
const list = await deployments.list();

const filtered = list.filter((d) => d.status !== "DRAFT");

console.log(`Found ${filtered.length} deployments (excluding DRAFTs)`);

for (const d of filtered) {
  console.log(JSON.stringify({
    id: d.id,
    name: d.name,
    status: d.status,
    strategy: d.strategy,
    replicas: d.replicas,
    market: d.market,
    vault: d.vault.address,
    timeout: d.timeout,
    rotation_time: (d as any).rotation_time,
    created_at: d.created_at,
    updated_at: d.updated_at,
    endpoints: d.endpoints,
  }, null, 2));
}
