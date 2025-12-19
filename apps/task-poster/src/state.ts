import { KV } from "@cross/kv";
export const managerId = "12D3KooWAb9rbnCHB9cgNgCcbrmtj73KKBrw5GkNgAC4SQRf9cPb";

export const db = new KV({ autoSync: true });

// state to track the publish proress of CSV files
export const publishProgress: Record<number, Record<number, any>> = {};

export const managerUrl = "http://mgr1.alpha.effect.net:8889";

export var theme = "pistachio";
export const setTheme = (t: string) => (theme = t);
