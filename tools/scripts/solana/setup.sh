solana airdrop 10 authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV
spl-token create-token ./tools/keys/mint.json --decimals 6
spl-token create-account mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P
spl-token mint mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P 5000000
anchor deploy --provider.cluster=localnet
