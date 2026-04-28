#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$DIR/.env.local" ]; then
  export $(grep -v '^#' "$DIR/.env.local" | xargs)
fi
exec stitch-mcp proxy
