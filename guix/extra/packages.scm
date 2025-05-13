(define-module (packages)
  #:use-module (gnu packages base)
  #:use-module (gnu packages bash)
  #:use-module (gnu packages compression)
  #:use-module (gnu packages crates-io)
  #:use-module (gnu packages ncurses)
  #:use-module (gnu packages pkg-config)
  #:use-module (gnu packages version-control)
  #:use-module (guix packages)
  #:use-module (guix gexp)
  #:use-module (guix git-download)
  #:use-module (guix download)
  #:use-module (guix build-system node)
  #:use-module ((guix licenses) #:prefix license:)

  #:use-module (gnu packages gcc)
  #:use-module (gnu packages linux)
  ;; #:use-module (nonguix build-system binary)
  )

(define-public node-pnpm
  (package
    (name "node-pnpm")
    (version "10.10.0")
    (source
     (origin
       (method url-fetch)
       (uri (string-append "https://registry.npmjs.org/pnpm/-/pnpm-" version ".tgz"))
       (sha256
	(base32 "0c1af3n0w0djbfv9k44r9xxz0w62i03l4cmlnv9685qrm0x523zs"))))
    (build-system node-build-system)
    (arguments
     (list
      #:tests? #f
      #:phases
      #~(modify-phases %standard-phases
	  (delete 'build))))
    (home-page "https://pnpm.io")
    (synopsis "Fast, disk space efficient package manager")
    (description "Fast, disk space efficient package manager")
    (license license:expat)))

;; (define-public solana-2.0.15
;;   (package
;;     (name "solana")
;;     (version "1.18.26")
;;     (source (origin
;; 	      (method url-fetch)
;; 	      (uri (string-append
;; 		    "https://github.com/anza-xyz/agave/releases/download/v"
;; 		    version "/solana-release-x86_64-unknown-linux-gnu.tar.bz2"))
;; 	      (sha256
;; 	       (base32
;; 		"1xlp3kkz2ac4crz3sf29rr4zz2g3ghi2nqyl0q9zqvaka7s4virs"))))
;;     (arguments
;;      `(#:patchelf-plan
;;        `(("bin/solana" ("glibc" "gcc:lib" "eudev"))
;; 	 ("bin/spl-token" ("glibc" "gcc:lib" "eudev"))
;; 	 ("bin/solana-keygen" ("glibc" "gcc:lib" "eudev"))
;; 	 ("bin/cargo-build-bpf" ("glibc" "gcc:lib"))
;; 	 ("bin/cargo-build-sbf" ("glibc" "gcc:lib"))
;; 	 ("bin/cargo-test-bpf" ("glibc" "gcc:lib"))
;; 	 ("bin/cargo-test-sbf" ("glibc" "gcc:lib")))
;;        #:install-plan
;;        `(("bin/solana" "bin/")
;; 	 ("bin/spl-token" "bin/")
;; 	 ("bin/solana-keygen" "bin/")
;; 	 ("bin/cargo-build-bpf" "bin/")
;; 	 ("bin/cargo-build-sbf" "bin/")
;; 	 ("bin/sdk" "bin/")
;; 	 ("bin/cargo-test-bpf" "bin/")
;; 	 ("bin/cargo-test-sbf" "bin/"))))
;;     (inputs
;;      `(("gcc:lib" ,gcc "lib")
;;        ("glibc" ,glibc)
;;        ("eudev" ,eudev)))
;;     (build-system binary-build-system)
;;     (home-page "https://solana.com/")
;;     (synopsis "Blockchain, Rebuilt for Scale")
;;     (description "Blockchain, Rebuilt for Scale")
;;     (license license:asl2.0)))
