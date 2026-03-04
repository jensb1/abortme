#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
else
  echo "Error: .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"

echo "==> Building production app..."
cd "$SCRIPT_DIR/native"
bun run build

echo "==> Creating DMG..."
cd build/dev-macos-arm64
rm -f AbortMe.dmg
hdiutil create -volname "AbortMe" -srcfolder AbortMe-dev.app -ov -format UDZO AbortMe.dmg

echo "==> Deploying to ${REMOTE}:${DEPLOY_PATH}..."
ssh "$REMOTE" "mkdir -p ${DEPLOY_PATH}"
scp AbortMe.dmg "$REMOTE:${DEPLOY_PATH}/"
scp "$SCRIPT_DIR/landing/index.html" "$REMOTE:${DEPLOY_PATH}/"
scp "$SCRIPT_DIR/native/assets/logo.svg" "$REMOTE:${DEPLOY_PATH}/"

echo "==> Installing to /Applications..."
rm -rf /Applications/AbortMe-dev.app
cp -R AbortMe-dev.app /Applications/

echo "==> Done!"
echo "   Landing page: https://jensvibe.com/abortme"
echo "   Local app:    /Applications/AbortMe-dev.app"
