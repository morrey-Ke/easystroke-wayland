#!/usr/bin/env python3
"""Firefox/Floorp native-messaging host and local gesture-action client."""

import json
import os
import selectors
import socket
import struct
import sys
from pathlib import Path

HOST_NAME = 'org.easystroke.wayland'
VALID_BROWSERS = {'firefox', 'floorp'}
VALID_ACTIONS = {
    'new-tab', 'back', 'forward', 'reload', 'close-tab', 'new-window',
}


def socket_path(browser):
    runtime = os.environ.get('XDG_RUNTIME_DIR', f'/run/user/{os.getuid()}')
    return Path(runtime) / f'easystroke-wayland-{browser}.sock'


def send_action(browser, action):
    if browser not in VALID_BROWSERS or action not in VALID_ACTIONS:
        raise SystemExit('unsupported browser or action')
    path = socket_path(browser)
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
        client.settimeout(1.5)
        client.connect(str(path))
        client.sendall((json.dumps({'action': action}) + '\n').encode())


def send_native_message(message):
    payload = json.dumps(message, separators=(',', ':')).encode()
    sys.stdout.buffer.write(struct.pack('<I', len(payload)))
    sys.stdout.buffer.write(payload)
    sys.stdout.buffer.flush()


def run_native_host(browser):
    if browser not in VALID_BROWSERS:
        raise SystemExit('native host must be started with firefox or floorp')
    path = socket_path(browser)
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        path.unlink()
    except FileNotFoundError:
        pass

    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server.bind(str(path))
    os.chmod(path, 0o600)
    server.listen(4)
    server.setblocking(False)

    selector = selectors.DefaultSelector()
    selector.register(server, selectors.EVENT_READ, 'listener')
    stdin_fd = sys.stdin.fileno()
    os.set_blocking(stdin_fd, False)
    selector.register(stdin_fd, selectors.EVENT_READ, 'browser')
    clients = {}
    stdin_buffer = bytearray()

    try:
        while True:
            for key, _ in selector.select():
                if key.data == 'listener':
                    client, _ = server.accept()
                    client.setblocking(False)
                    clients[client] = bytearray()
                    selector.register(client, selectors.EVENT_READ, 'client')
                elif key.data == 'browser':
                    data = os.read(stdin_fd, 65536)
                    if not data:
                        return
                    stdin_buffer.extend(data)
                    while len(stdin_buffer) >= 4:
                        size = struct.unpack_from('<I', stdin_buffer)[0]
                        if len(stdin_buffer) < size + 4:
                            break
                        del stdin_buffer[:size + 4]
                else:
                    client = key.fileobj
                    data = client.recv(4096)
                    if not data:
                        selector.unregister(client)
                        clients.pop(client, None)
                        client.close()
                        continue
                    buffer = clients[client]
                    buffer.extend(data)
                    if b'\n' not in buffer:
                        continue
                    raw, _, _remainder = buffer.partition(b'\n')
                    try:
                        request = json.loads(raw.decode())
                        action = request.get('action')
                        if action in VALID_ACTIONS:
                            send_native_message({'action': action})
                    except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
                        pass
                    selector.unregister(client)
                    clients.pop(client, None)
                    client.close()
    finally:
        for client in clients:
            client.close()
        selector.close()
        server.close()
        try:
            path.unlink()
        except FileNotFoundError:
            pass


def main():
    if len(sys.argv) == 4 and sys.argv[1] == '--send':
        send_action(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 2:
        run_native_host(sys.argv[1])
    else:
        raise SystemExit(f'usage: {HOST_NAME} <firefox|floorp> | --send <browser> <action>')


if __name__ == '__main__':
    main()
