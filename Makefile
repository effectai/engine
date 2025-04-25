SNARKJS  ?= node zkp/node_modules/snarkjs/cli.js
CIRCOM   ?= circom
CIRCUIT  ?= PaymentBatch
TAU_SIZE ?= 19

# Compilation of the circuit
%.r1cs %_js: zkp/circuits/${CIRCUIT}.circom
	$(CIRCOM) $^ --r1cs --wasm --output zkp/circuits

zkp/setup:
	mkdir -p zkp/setup

# Phase 1 of ceremony
# Outputs general keys for 2^$TAU_SIZE params
zkp/setup/pot${TAU_SIZE}_final.ptau: | zkp/setup
	$(SNARKJS) powersoftau new bn128 ${TAU_SIZE} zkp/setup/pot${TAU_SIZE}_0000.ptau -v
	$(SNARKJS) powersoftau contribute zkp/setup/pot${TAU_SIZE}_0000.ptau \
		zkp/setup/pot${TAU_SIZE}_0001.ptau \
		--name="Second" -v -e="random text"
	$(SNARKJS) powersoftau prepare phase2 zkp/setup/pot${TAU_SIZE}_0001.ptau $@ -v
	rm zkp/setup/pot${TAU_SIZE}_0001.ptau \
		zkp/setup/pot${TAU_SIZE}_0000.ptau

# Second phase of ceremony
# Outputs proving and verifcation key for $CIRCUIT
zkp/circuits/${CIRCUIT}_0001.zkey: zkp/circuits/${CIRCUIT}.r1cs | zkp/setup/pot${TAU_SIZE}_final.ptau
	$(SNARKJS) groth16 setup $^ $| ${CIRCUIT}_0000.zkey
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

guixify:
	guix shell -m guix/manifest.scm -L guix/extra --expose /root/manager-key.json --container --network --emulate-fhs

.PHONY: clean download_ptau guixify
