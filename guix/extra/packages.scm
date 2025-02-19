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
  #:use-module ((guix licenses) #:prefix license:))

(define-public node-pnpm
  (package
    (name "node-pnpm")
    (version "10.4.1")
    (source
     (origin
       (method url-fetch)
       (uri "https://registry.npmjs.org/pnpm/-/pnpm-10.4.1.tgz")
       (sha256
	(base32 "15wijn5n1jm4jdz4ybmmfay46anhsq26p0q08cyr75b9k23jhw2b"))))
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
