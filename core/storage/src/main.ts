import { createStorage, type Driver } from "unstorage";

//TODO:: this package is the gateway (storage layer) for the Effect AI Protocol
// it should be able to connect to different storage backends (ipfs, s3, local fs, etc)
// and provide a unified interface for the rest of the application to interact with.

export const init = (driver: Driver) => {
  const storage = createStorage();
  storage.mount("data", driver);
};
