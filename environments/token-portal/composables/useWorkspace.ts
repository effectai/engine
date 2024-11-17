import * as anchor from '@coral-xyz/anchor';
import type {Program, Idl} from '@coral-xyz/anchor';
import programIDL from "../../../solana/target/idl/solana_snapshot_migration.json";
import type {SolanaSnapshotMigration} from '../../../solana/target/types/solana_snapshot_migration'
import { useAnchorWallet } from 'solana-wallets-vue';


export const useAnchorWorkspace = () => {
    const wallet = useAnchorWallet();
    const {connection} = useSolana();
    const provider = new anchor.AnchorProvider(connection, wallet.value, {})

    const program = new anchor.Program(programIDL as Idl, provider) as unknown as Program<SolanaSnapshotMigration>;

    return { program };
}