# EasyStroke Wayland for GNOME Shell

An Easystroke-inspired mouse-gesture extension for GNOME Shell/Mutter on Wayland, using GNOME Shell's ES-module extension API.

## Features

- Four straight gestures and 12 ordered two-direction combinations with different directions (same-direction pairs are excluded).
- Configurable commands and optional GNOME global keyboard shortcuts for each gesture.
- To set a shortcut, focus its field and press the keys directly (for example Ctrl+R or Alt+Left). Backspace/Delete clears the shortcut.
- Configurable mouse trigger button and minimum pointer travel.

## Install

```sh
git clone https://github.com/morrey-Ke/easystroke-wayland.git
cd easystroke-wayland
EXT="$HOME/.local/share/gnome-shell/extensions/easystroke-wayland@morrey-ke"
mkdir -p "$EXT"
cp -r easystroke-wayland@morrey-ke/. "$EXT/"
glib-compile-schemas --strict "$EXT/schemas"
gnome-extensions enable easystroke-wayland@morrey-ke
gnome-extensions prefs easystroke-wayland@morrey-ke
```

On Wayland, log out and back in after installing or updating extension code.

## Notes

The extension runs only in GNOME Shell/Mutter. Gesture commands are user-configured shell commands; only enter commands you trust. For a harmless test, use `notify-send 'Gesture test' left` (requires `libnotify`).

Check the schema and JSON before installing:

```sh
glib-compile-schemas --strict --dry-run easystroke-wayland@morrey-ke/schemas
python -m json.tool easystroke-wayland@morrey-ke/metadata.json >/dev/null
```
