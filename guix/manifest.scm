
(specifications->manifest
  (list "node"
        "python"
        "gcc-toolchain"
        "make"
        "libgudev"
        "coreutils"
        "bash"
	"findutils"
        "nss-certs"
        "sed"
	"git"
	"less"

	;; these are packaged locally in guix/extra/packages.scm
	;; "solana"
	"node-pnpm"))
