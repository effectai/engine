import { LevelDatastore } from "datastore-level";

export const createDataStore = async (path: string) => {
  const datastore = new LevelDatastore(path);
  await datastore.open();
  return datastore;
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export * from "./solana.js";
