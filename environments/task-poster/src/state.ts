import { KV } from "@cross/kv";
export const managerId = "12D3KooWAb9rbnCHB9cgNgCcbrmtj73KKBrw5GkNgAC4SQRf9cPb";

export const db = new KV({ autoSync: true });

// state to track the publish proress of CSV files
export const publishProgress: Record<number, any> = {};

export const managerUrl = "http://mgr1.alpha.effect.net:8889";
//`http://localhost:8889`;  // "http://mgr1.stage.effect.net:8889",
