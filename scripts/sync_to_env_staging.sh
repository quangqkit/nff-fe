#!/bin/bash

echo "============================================================"
echo "SYNC SCRIPT: NFF-Auto-Report -> env-staging"
echo "============================================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PYTHON_CMD=""

if [ -f "../venv/Scripts/python.exe" ]; then
    PYTHON_CMD="../venv/Scripts/python.exe"
elif [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "Error: Python not found."
    echo "Please:"
    echo "  1. Install Python, or"
    echo "  2. Make sure venv exists at ../venv/"
    exit 1
fi

echo "Using Python: $PYTHON_CMD"
echo ""
$PYTHON_CMD sync_to_env_staging.py

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "Script failed with error code: $EXIT_CODE"
    exit $EXIT_CODE
fi

