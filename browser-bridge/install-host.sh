#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/easystroke-wayland/native-messaging"
HOST="$HOST_DIR/native-host.py"
EXTENSION_ID='easystroke-browser@morrey-ke'
NATIVE_NAME='org.easystroke.wayland'

install -d -m 700 "$HOST_DIR"
install -m 755 "$ROOT/browser-bridge/native-host.py" "$HOST"

install_manifest() {
    local browser="$1" destination="$2" manifest
    install -d -m 700 "$destination"
    manifest="$(mktemp)"
    python3 - "$HOST" "$NATIVE_NAME" "$EXTENSION_ID" "$browser" >"$manifest" <<'PY'
import json, sys
host, name, extension_id, browser = sys.argv[1:]
print(json.dumps({
    'name': name,
    'description': 'EasyStroke Wayland gesture actions for Firefox and Floorp',
    'path': host,
    'type': 'stdio',
    'allowed_extensions': [extension_id],
    'args': [browser],
}, indent=2))
PY
    install -m 600 "$manifest" "$destination/$NATIVE_NAME.json"
    rm -f "$manifest"
}

install_manifest firefox "$HOME/.mozilla/native-messaging-hosts"
install_manifest floorp "$HOME/.floorp/native-messaging-hosts"

printf 'Native messaging host installed at %s\n' "$HOST"
printf 'Firefox manifest: %s\n' "$HOME/.mozilla/native-messaging-hosts/$NATIVE_NAME.json"
printf 'Floorp manifest: %s\n' "$HOME/.floorp/native-messaging-hosts/$NATIVE_NAME.json"
printf 'Install browser-bridge/webextension as a temporary add-on in each browser.\n'
