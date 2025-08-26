import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { useSignMessage } from "@solana/react";
import { useConnectedUiWallet } from "../hooks/useConnectedUiWallet";

function SignMessageButton({ account, messageBytes }) {
  const signMessage = useSignMessage(account);
  return (
    <button
      onClick={async () => {
        try {
          const { signature } = await signMessage({
            message: messageBytes,
          });
          window.alert(`Signature bytes: ${signature.toString()}`);
        } catch (e) {
          console.error("Failed to sign message", e);
        }
      }}
    >
      Sign Message
    </button>
  );
}

export function TestButton() {
  const { wallet } = useUnifiedWallet();
  const uiWallet = useConnectedUiWallet();

  return (
    uiWallet?.accounts[0] && (
      <SignMessageButton
        account={uiWallet?.accounts[0]}
        messageBytes={new TextEncoder().encode(
          `Hello from ${wallet?.name} at ${new Date().toISOString()}`,
        )}
      />
    )
  );
}
