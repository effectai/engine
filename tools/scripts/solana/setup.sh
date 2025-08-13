solana airdrop 10 authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV
spl-token create-token ./solana/tests/keys/mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P.json --decimals 6
spl-token create-account mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P
spl-token mint mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P 5000000
solana airdrop 10 D7fMoACKfsdeGwyM3j7u7iRovEf9o86JmvjUPAXNyHvt
cd ./solana && anchor deploy --provider.cluster=localnet
