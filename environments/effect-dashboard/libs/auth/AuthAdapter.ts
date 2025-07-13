export interface AuthAdapter {
  getUserName(): Promise<string>;
  getPrivateKey(): Promise<string | null>;
  isAuthenticated(): boolean;
}
