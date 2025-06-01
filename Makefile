SNARKJS  ?= node packages/zkp/node_modules/snarkjs/cli.js
CIRCOM   ?= circom
CIRCUIT  ?= PaymentBatch
TAU_SIZE ?= 19

BASE      = packages/zkp

# Compilation of the circuit
%.r1cs %_js: packages/zkp/circuits/${CIRCUIT}.circom
	$(CIRCOM) $^ --r1cs --wasm --output packages/zkp/circuits

packages/zkp/setup:
	mkdir -p packages/zkp/setup

# Phase 1 of ceremony
packages/zkp/setup/pot${TAU_SIZE}_final.ptau: | packages/zkp/setup
	$(SNARKJS) powersoftau new bn128 ${TAU_SIZE} packages/zkp/setup/pot${TAU_SIZE}_0000.ptau -v
	$(SNARKJS) powersoftau contribute packages/zkp/setup/pot${TAU_SIZE}_0000.ptau \
		packages/zkp/setup/pot${TAU_SIZE}_0001.ptau \
		--name="Second" -v -e="random text"
	$(SNARKJS) powersoftau prepare phase2 packages/zkp/setup/pot${TAU_SIZE}_0001.ptau $@ -v
	rm packages/zkp/setup/pot${TAU_SIZE}_0001.ptau \
		packages/zkp/setup/pot${TAU_SIZE}_0000.ptau

# Second phase of ceremony
${BASE}/circuits/${CIRCUIT}_0001.zkey: ${BASE}/circuits/${CIRCUIT}.r1cs | packages/zkp/setup/pot${TAU_SIZE}_final.ptau
	$(SNARKJS) groth16 setup $^ $| ${CIRCUIT}_0000.zkey
	$(SNARKJS) zkey contribute ${CIRCUIT}_0000.zkey ${CIRCUIT}_0001.zkey --name="First" -v -e='random'
	rm ${CIRCUIT}_0000.zkey
	mv ${CIRCUIT}_0001.zkey $@

# Export the verification key
.PHONY: zkp-vkey
zkp-vkey: ${BASE}/circuits/${CIRCUIT}_verification.json
${BASE}/circuits/${CIRCUIT}_verification.json: packages/zkp/circuits/${CIRCUIT}_0001.zkey
	$(SNARKJS) zkey export verificationkey $^ ${CIRCUIT}_verification.json
	mv ${CIRCUIT}_verification.json $@

# Create .rs version of verifying key
.PHONY: verifying-key
verifying-key: solana/programs/effect-payment/src/verifying_key.rs
solana/programs/effect-payment/src/verifying_key.rs: ${BASE}/circuits/${CIRCUIT}_verification.json
	pnpm -C packages/zkp run generate_verification_key \
		../../$< \
		$(dir ../../$@)

clean:
	rm -f packages/zkp/setup/*.ptau packages/zkp/circuits/*.r1cs packages/zkp/circuits/*.zkey
	rm solana/programs/effect-payment/program/src/verifying_key.rs
	rm packages/zkp/circuits/${CIRCUIT}_verification.json
	rm -rf packages/zkp/circuits/${CIRCUIT}_js

guixify:
	guix shell -m guix/manifest.scm -L guix/extra --expose=/root/manager-key.json --container --network --emulate-fhs

.PHONY: clean guixify
