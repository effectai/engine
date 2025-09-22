import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Input,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useWalletContext,
} from "@effectai/react";

import {
  Wallet,
  Keyboard,
  Copy,
  ArrowRight,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { BlockchainAddress } from "../BlockchainAddress";
import { useMigrationStore } from "@/stores/migrationStore";

export function SolanaDestinationStep({}: Props) {
  const [manualMode, setManualMode] = React.useState(false);

  const goTo = useMigrationStore((s) => s.goTo);

  const { address, lamports } = useWalletContext();
  const destinationAddress = useMigrationStore((s) => s.destinationAddress);
  const setDestinationAddress = useMigrationStore(
    (s) => s.setDestinationAddress,
  );

  //whenever address from wallet changes, update destinationAddress in store (if not in manual mode)
  //this allows user to switch wallet and have the new address picked up automatically
  //but if user is in manual mode, don't override their input

  React.useEffect(() => {
    if (manualMode) return;
    if (address) {
      setDestinationAddress(address);
    }
  }, [address, manualMode, setDestinationAddress]);

  const selectAddress = () => {
    const input = manualAddressInput.trim();
    //validate base58
    //https://en.wikipedia.org/wiki/Base58
    //
  };

  const [manualAddressInput, setManualAddressInput] = React.useState("");

  const hasSolanaWalletInstalled = React.useMemo(
    () => typeof window !== "undefined" && !!(window as any).solana,
    [],
  );

  const canContinue = !!destinationAddress;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 ">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Choose your Solana address
            </CardTitle>
            <CardDescription>
              This address will receive your new EFFECT tokens on Solana.
            </CardDescription>
          </div>
          {destinationAddress && (
            <Badge variant="secondary" className="whitespace-nowrap">
              Destination set
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="">
        {!destinationAddress ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {hasSolanaWalletInstalled && (
                <>
                  <UnifiedWalletButton
                    overrideContent={<button>use wallet</button>}
                  />
                  <span className="text-sm text-muted-foreground">or</span>
                </>
              )}

              <Button
                variant="ghost"
                className="h-9 px-2 text-sm"
                onClick={() => setManualMode((v) => !v)}
              >
                <Keyboard className="mr-2 h-4 w-4" />
                {manualMode ? "Use wallet" : "Enter address manually"}
              </Button>
            </div>

            {(!hasSolanaWalletInstalled || manualMode) && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Your Solana address (e.g. 4Nd1m... )"
                    value={manualAddressInput}
                    onChange={(e) => setManualAddressInput(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button onClick={selectAddress}>Confirm</Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tip: paste your base58 Solana address. We’ll validate it
                  before continuing.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Chosen address:
              </span>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-2">
                      <BlockchainAddress address={destinationAddress} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          navigator.clipboard?.writeText(destinationAddress)
                        }
                        title="Copy address"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <span className="font-mono text-xs">
                      {destinationAddress}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="outline"
                size="sm"
                className="ml-1"
                onClick={() => setDestinationAddress(null)}
                title="Pick a different address"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Switch
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full justify-end">
          <Button
            onClick={() => goTo("authorize")}
            disabled={!canContinue}
            className="group"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
