import { KV } from "@cross/kv";
export const managerId = "12D3KooWAb9rbnCHB9cgNgCcbrmtj73KKBrw5GkNgAC4SQRf9cPb";

export const db = new KV();
await db.open("mydatabase.db");
