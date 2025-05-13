import { Base58, PublicKey } from "@wharfkit/antelope";

export const extractKeyFromEosUsername = async (
  username: string,
  key = "active"
): Promise<string> => {
  const result = await fetch("https://eos.greymass.com/v1/chain/get_account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_name: username,
    }),
  });

  const data = await result.json();

  const activePermission = data.permissions.find(
    (permission: any) => permission.perm_name === key
  );

  if (!activePermission) {
    throw new Error(`No ${key} permission found for account ${username}`);
  }

  const publicKey = activePermission.required_auth.keys[0].key.toString();

  return publicKey;
};

export function extractEosPublicKeyBytes(eosPubkey: string): Uint8Array | null {
  const publicKey = PublicKey.from(eosPubkey);
  return publicKey.data.array.slice(1, 33);
}
