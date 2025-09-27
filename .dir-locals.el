((nil . ((eval . (progn
		   ;; exclude build folders from project searches
		   (add-to-list 'project-vc-ignores "./.pnpm-store/")

		   ;; load our emacs setup file
		   (let ((setup-file (expand-file-name
				      "tools/editor-configs/emacs-setup.el"
				      (locate-dominating-file default-directory ".dir-locals.el"))))
		     (when (and setup-file (file-exists-p setup-file))
		       (unless (featurep 'effect/emacs-setup)
			 (load setup-file)))))))))
