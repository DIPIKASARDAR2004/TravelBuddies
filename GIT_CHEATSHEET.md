# Reviewing changes on a branch

The requested workflow is **implementation → `testing` branch review → separately approved merge to `main`**. Publishing is a later step, not part of current maintenance. This guide does not claim that a `testing` branch exists or that anything has been pushed.

## Inspect without changing files

Run these from the TravelBuddies repository root:

```sh
git status --short
git branch --show-current
git branch --list testing
git diff --stat
```

“Uncommitted” means edited/new local files not recorded in a Git commit. Switching branches does not save them; `main` is a branch name, not proof that its contents are stable or deployed.

## Later, after publication is authorized

Confirm the intended remote and whether local/remote `testing` already exists. Review and preserve existing edits before selecting a branch; do not overwrite an existing branch, force-push, discard changes or stage everything blindly. Commits must exclude private environment files, generated artifacts and unrelated work.

Stop development servers before switching an approved clean checkout, then follow [README setup/checks](README.md) in `frontend`, including lockfile-based `npm ci`. Do not assume a branch added fonts, dependencies or a redesign. Use mocked checks before running an app against configured services.

If Git refuses to switch because of local edits, stop and review those edits. A stash is temporary local storage, not a discard command or off-machine backup; default stashing also omits untracked files. Do not prescribe stash, commit or deletion without knowing what needs preservation.

Review the `testing` diff and checks before separately approving a merge. A passing local suite does not prove hosted CI, deployment, provider settlement or production readiness.
