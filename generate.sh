#!/usr/bin/env bash

# Usage:
# ./generate.sh lib auth
# ./generate.sh api users


set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <type: lib|api> <name>"
  echo "Examples:"
  echo "  $0 lib common/auth"
  echo "  $0 api api/users"
  exit 1
fi

TYPE="$1"
NAME="$2"

# Sanity check
if [[ ! -f "nx.json" ]]; then
  echo "Error: nx.json not found. Run this from your Nx workspace root."
  exit 1
fi

case "$TYPE" in
  lib)
    CMD=(pnpm nx g @nx/js:library "common/${NAME}")
    ;;
  api)
    CMD=(pnpm nx g @nx/nest:application "api/${NAME}")
    ;;
  *)
    echo "Unknown type: $TYPE (expected lib or api)"
    exit 1
    ;;
esac

echo "--------------------------------------------------"
echo "Running Nx generate for:"
echo "  Type : $TYPE"
echo "  Name : $NAME"
echo "--------------------------------------------------"
echo "Command:"
printf "  %q " "${CMD[@]}"
echo
echo "--------------------------------------------------"

"${CMD[@]}"

echo "✅ Done!"
echo "Project generated at $(pwd)/$NAME"
echo "Next steps:"
echo "  pnpm nx graph       # visualize workspace"
echo "  pnpm nx build $NAME # build your new project"
