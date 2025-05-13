#!/bin/bash

echo "Building the Anchor program..."
anchor build

echo "Airdropping SOL..."
solana airdrop 20 authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV --url http://validator:8899

echo "Deploying the program..."
anchor deploy --program-name effect_payment --provider.cluster http://validator:8899

echo 'create mint'
spl-token create-token ./tests/keys/mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P.json --decimals 6 --url http://validator:8899
