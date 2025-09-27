;;; Emacs developer functions for Effect Mono Repo

;;; Commentary:
;; This file provides functions to help work in the Effect monorepo
;;
;; 1. Load this file: (load "tools/editor-configs/emacs-setup.el")
;;
;; This depends on the vterm library
;;
;; Functions provided:
;;
;; - effect/setup-terminals: opens dedicated vterms for: manager and
;; task poster, each in a guix container

(defun effect/open-terminals (root)
  (delete-other-windows)
  (let ((default-directory root))
    (vterm (format "*vterm- run manager"))
    (vterm-send-string "guix shell -m tools/guix/manifest.scm -L tools/guix/extra  --container --network --emulate-fhs python jq curl")
    (vterm-send-return)
    (vterm-send-string "node --watch tools/cli/dist/index.js manager start -k tools/keys/authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV.json")
    (vterm-send-return)

    (split-window-below)
    (vterm (format "*vterm- run poster"))
    (vterm-send-string "guix shell -m tools/guix/manifest.scm -L tools/guix/extra  --container --network --emulate-fhs python jq curl")
    (vterm-send-return)
    (vterm-send-string "cd apps/task-poster")
    (vterm-send-return)
    (vterm-send-string "pnpm dev")
    (vterm-send-return)

    (balance-windows)))

(defun effect/setup-vterms ()
  "Open several vterms for Effect dev."
  (interactive)
  (if-let ((root (project-current)))
      (let ((root-dir (project-root root)))
	(message "Opening terminal in %S" root-dir)
	(effect/open-terminals root-dir))
    (user-error "Not in a project")))

(provide 'effect/emacs-setup)
