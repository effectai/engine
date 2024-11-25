import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import stakingAnchorIdl from '../target/idl/effect_staking.json';
import rewardsAnchorIdl from '../target/idl/effect_rewards.json';
import { renderJavaScriptVisitor } from '@codama/renderers';
import path from 'node:path';

const codamaStakingProgram = createFromRoot(rootNodeFromAnchor(stakingAnchorIdl));
const codamaRewardsProgram = createFromRoot(rootNodeFromAnchor(rewardsAnchorIdl));

const pathToGeneratedFolder = (name: string) => path.join(__dirname, '../', '../', 'packages', name, "src");
const options = {};

// codama.update(
//     updateAccountsVisitor({
//         stake: {
//             name: "staking"
//         }
//     })
// );
// codama.update(updateInstructionsVisitor({ ... }));

codamaStakingProgram.accept(
    renderJavaScriptVisitor(pathToGeneratedFolder('staking'), options)
);

codamaRewardsProgram.accept(
    renderJavaScriptVisitor(pathToGeneratedFolder('rewards'), options)
);

// Log the Codama IDL in the console.
// codama.accept(consoleLogVisitor(getDebugStringVisitor({ indent: true })));
