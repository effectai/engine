SNARKJS  ?= node zkp/node_modules/snarkjs/cli.js
CIRCOM   ?= /home/jesse/repos/other/solana_circom_zkp_circuits/circom_-s/target/release/circom
CIRCUIT  ?= PaymentBatch
TAO_SIZE := 17

# Compilation of the circuit
%.r1cs %_js: zkp/circuits/${CIRCUIT}.circom
	$(CIRCOM) $^ --r1cs --wasm --output zkp/circuits

# First phase of ceremony
# Outputs general keys for 2^14 params
zkp/setup/pot${TAO_SIZE}_final.ptau:
	$(SNARKJS) powersoftau new bn128 ${TAO_SIZE} zkp/setup/pot${TAO_SIZE}_0000.ptau -v
	$(SNARKJS) powersoftau contribute zkp/setup/pot${TAO_SIZE}_0000.ptau \
		zkp/setup/pot${TAO_SIZE}_0001.ptau \
		--name="Second" -v -e="random text"
	$(SNARKJS) powersoftau prepare phase2 zkp/setup/pot${TAO_SIZE}_0001.ptau $@ -v
	rm zkp/setup/pot${TAO_SIZE}_0001.ptau \
		zkp/setup/pot${TAO_SIZE}_0000.ptau

# Second phase of ceremony
# Outputs proving and verifcation key for $CIRCUIT
zkp/circuits/${CIRCUIT}_0001.zkey: zkp/circuits/${CIRCUIT}.r1cs zkp/setup/pot${TAO_SIZE}_final.ptau
	$(SNARKJS) groth16 setup $^ ${CIRCUIT}_0000.zkey
	$(SNARKJS) zkey contribute ${CIRCUIT}_0000.zkey ${CIRCUIT}_0001.zkey --name="First" -v -e='random'
	rm ${CIRCUIT}_0000.zkey
	mv ${CIRCUIT}_0001.zkey $@

# Export the verification key for $CIRCUIT
zkp/circuits/${CIRCUIT}_verification.json: zkp/circuits/${CIRCUIT}_0001.zkey
	$(SNARKJS) zkey export verificationkey $^ ${CIRCUIT}_verification.json
	mv ${CIRCUIT}_verification.json	$@

# Create .rs version of verifying key
solana/programs/effect-payment/program/src/verifying_key.rs: zkp/circuits/${CIRCUIT}_verification.json
	pnpm -C zkp run generate_verification_key \
		../$< \
		$(dir ../$@)

clean:
	rm -f zkp/setup/*.ptau zkp/circuits/*.r1cs zkp/circuits/*.zkey
	rm solana/programs/effect-payment/program/src/verifying_key.rs
	rm zkp/circuits/${CIRCUIT}_verification.json
	rm -rf zkp/circuits/${CIRCUIT}_js

.PHONY: clean
