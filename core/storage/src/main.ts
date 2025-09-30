import { createStorage, type Driver } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

export const init = (driver: Driver) => {
  const storage = createStorage();
  storage.mount("data", driver);
};
