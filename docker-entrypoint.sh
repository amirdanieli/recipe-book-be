#!/bin/sh
set -e

echo "Starting app..."
exec node dist/src/main.js
