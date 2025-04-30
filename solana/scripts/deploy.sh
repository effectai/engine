#!/bin/bash

echo "Building the Anchor program..."
anchor build

echo "Airdropping SOL..."
solana airdrop 20 authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV --url http://validator:8899

echo "Deploying the program..."
anchor deploy --program-name effect_payment --provider.cluster http://validator:8899
