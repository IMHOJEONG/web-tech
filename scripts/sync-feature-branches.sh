#!/usr/bin/env bash

set -euo pipefail

REMOTE="${REMOTE:-origin}"
BASE_REF="${BASE_REF:-${REMOTE}/main}"
BRANCH_PATTERN="${BRANCH_PATTERN:-feature/*}"
APPLY=0
PUSH=0
FETCH=1

usage() {
    cat <<'EOF'
Usage: bash ./scripts/sync-feature-branches.sh [options]

Synchronize local feature branches with origin/main.

Options:
  --apply              Merge the base ref into each feature branch.
  --push               Push updated branches after a successful merge. Requires --apply.
  --no-fetch           Skip git fetch before checking branches.
  --base=<ref>         Base ref to merge from. Default: origin/main.
  --remote=<name>      Remote name. Default: origin.
  --pattern=<glob>     Branch glob below refs/heads and refs/remotes/<remote>. Default: feature/*.
  -h, --help           Show this help.

Default mode is dry-run. It reports which feature branches are missing commits from the base ref.
EOF
}

for arg in "$@"; do
    case "$arg" in
        --)
            ;;
        --apply)
            APPLY=1
            ;;
        --push)
            PUSH=1
            ;;
        --no-fetch)
            FETCH=0
            ;;
        --base=*)
            BASE_REF="${arg#*=}"
            ;;
        --remote=*)
            REMOTE="${arg#*=}"
            ;;
        --pattern=*)
            BRANCH_PATTERN="${arg#*=}"
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "[feature-sync] Unknown option: $arg" >&2
            usage >&2
            exit 2
            ;;
    esac
done

if [ "$PUSH" -eq 1 ] && [ "$APPLY" -ne 1 ]; then
    echo "[feature-sync] --push requires --apply." >&2
    exit 2
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[feature-sync] This command must run inside a git worktree." >&2
    exit 1
fi

if [ "$APPLY" -eq 1 ] && [ -n "$(git status --porcelain)" ]; then
    echo "[feature-sync] Working tree must be clean before applying branch sync." >&2
    exit 1
fi

if [ "$FETCH" -eq 1 ]; then
    echo "[feature-sync] Fetching ${REMOTE}..."
    git fetch "$REMOTE"
fi

if ! git rev-parse --verify --quiet "$BASE_REF" >/dev/null; then
    echo "[feature-sync] Base ref not found: ${BASE_REF}" >&2
    exit 1
fi

mapfile -t branches < <(
    git for-each-ref \
        --format='%(refname:short)' \
        "refs/heads/${BRANCH_PATTERN}" \
        "refs/remotes/${REMOTE}/${BRANCH_PATTERN}" |
        sed "s#^${REMOTE}/##" |
        sort -u
)

if [ "${#branches[@]}" -eq 0 ]; then
    echo "[feature-sync] No branches matched ${BRANCH_PATTERN}."
    exit 0
fi

original_branch="$(git branch --show-current)"
restore_original_branch() {
    if [ -n "$original_branch" ]; then
        git switch -q "$original_branch" >/dev/null 2>&1 || true
    fi
}

if [ "$APPLY" -eq 1 ]; then
    trap restore_original_branch EXIT
fi

failed=()
updated=()
already_synced=()

for branch in "${branches[@]}"; do
    if ! git show-ref --verify --quiet "refs/heads/${branch}"; then
        if git show-ref --verify --quiet "refs/remotes/${REMOTE}/${branch}"; then
            if [ "$APPLY" -ne 1 ]; then
                comparison_ref="${REMOTE}/${branch}"
            else
                echo "[feature-sync] Creating local tracking branch ${branch} from ${REMOTE}/${branch}."
                git branch --track "$branch" "${REMOTE}/${branch}" >/dev/null
                comparison_ref="$branch"
            fi
        else
            echo "[feature-sync] Skipping missing branch: ${branch}" >&2
            continue
        fi
    else
        comparison_ref="$branch"
    fi

    if git merge-base --is-ancestor "$BASE_REF" "$comparison_ref"; then
        echo "[feature-sync] ${branch}: already contains ${BASE_REF}."
        already_synced+=("$branch")
        continue
    fi

    missing_count="$(git rev-list --count "${comparison_ref}..${BASE_REF}")"

    if [ "$APPLY" -ne 1 ]; then
        echo "[feature-sync] ${branch}: missing ${missing_count} commit(s) from ${BASE_REF}."
        continue
    fi

    if ! git show-ref --verify --quiet "refs/heads/${branch}"; then
        if git show-ref --verify --quiet "refs/remotes/${REMOTE}/${branch}"; then
            echo "[feature-sync] Creating local tracking branch ${branch} from ${REMOTE}/${branch}."
            git branch --track "$branch" "${REMOTE}/${branch}" >/dev/null
        else
            echo "[feature-sync] Skipping missing branch: ${branch}" >&2
            continue
        fi
    fi

    echo "[feature-sync] ${branch}: merging ${BASE_REF}."
    git switch -q "$branch"

    if git merge --no-edit "$BASE_REF"; then
        updated+=("$branch")
    else
        echo "[feature-sync] ${branch}: merge conflict. Aborting merge and continuing." >&2
        git merge --abort >/dev/null 2>&1 || true
        failed+=("$branch")
        continue
    fi

    if [ "$PUSH" -eq 1 ]; then
        if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
            git push "$REMOTE" "$branch"
        else
            git push -u "$REMOTE" "$branch"
        fi
    fi
done

echo "[feature-sync] Summary"
echo "[feature-sync] Already synced: ${#already_synced[@]}"
echo "[feature-sync] Updated: ${#updated[@]}"
echo "[feature-sync] Failed: ${#failed[@]}"

if [ "${#failed[@]}" -gt 0 ]; then
    printf '[feature-sync] Failed branches:\n' >&2
    printf '  - %s\n' "${failed[@]}" >&2
    exit 1
fi
