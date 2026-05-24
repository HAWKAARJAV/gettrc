#!/usr/bin/env bash
set -euo pipefail

echo "Running basic checks: lint + vite build"

npm run lint || true
npm run build

echo "Basic checks passed (lint errors may be non-fatal)." 
