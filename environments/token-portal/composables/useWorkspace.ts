import * as anchor from '@coral-xyz/anchor';
import type {Program, Idl} from '@coral-xyz/anchor';
import programIDL from "../../../solana/target/idl/solana_snapshot_migration.json";
import type {SolanaSnapshotMigration} from '../../../solana/target/types/solana_snapshot_migration'
import { useAnchorWallet } from 'solana-wallets-vue';
import { Connection } from '@solana/web3.js';


export const useAnchorWorkspace = () => {
    const connection = new Connection('http://localhost:8899', 'confirmed');
    const wallet = useAnchorWallet();
    const provider = new anchor.AnchorProvider(connection, wallet.value, {})
    
    const program = new anchor.Program(programIDL as Idl, provider) as unknown as Program<SolanaSnapshotMigration>;

    console.log("Program", program);

    return { program };
}