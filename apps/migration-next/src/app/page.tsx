"use client";
import {
  UnifiedWalletButton,
  UnifiedWalletProvider,
} from "@jup-ag/wallet-adapter";
import { TestButton } from "./components/TestButton";
import { useMigration } from "./providers/MigrationProvider";
import MigrationFlow from "./components/MigrationFlow";

export default function Home() {
  const { dest, sourceChain } = useMigration();
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <MigrationFlow />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </div>
  );
}
