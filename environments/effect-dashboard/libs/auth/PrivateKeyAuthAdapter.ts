import type { AuthAdapter } from "./AuthAdapter";

class PrivateKeyAdapter implements AuthAdapter {
  privateKey: string | null;

  constructor(privateKey: string | null) {
    this.privateKey = privateKey;
  }

  async getUserName() {
    return "Anonymous User";
  }

  async getPrivateKey() {
    return this.privateKey;
  }

  isAuthenticated() {
    const loginMethod = localStorage.getItem("loginMethod");
    return !!this.privateKey && loginMethod === "privateKey";
  }
}
